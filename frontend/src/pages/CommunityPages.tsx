import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ImagePlus, Search, Trash2, Upload, Users } from "lucide-react";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { PageHeader } from "../components/shared/PageHeader";
import { ProfileAvatar } from "../components/shared/ProfileAvatar";
import { mediaUrl } from "../lib/utils";
import type { Batch, Page, User } from "../types";

type DirectoryItem = {
  id: string;
  full_name: string;
  student_id: string;
  graduation_year: number | null;
  major: string;
  batch: Batch | null;
  profile_photo: string | null;
  company_name: string;
};
type GalleryItem = {
  id: string;
  image: string;
  caption: string;
  uploaded_by_name: string;
  created_at: string;
};
const list = <T,>(data: Page<T> | T[] | undefined): T[] =>
  Array.isArray(data) ? data : data?.results || [];
const err = (e: any) =>
  e?.response?.data?.detail ||
  Object.values(e?.response?.data || {})
    .flat()
    .find((x) => typeof x === "string") ||
  "Please try again.";
const imageUrl = mediaUrl;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function AccountProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [preview, setPreview] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const qc = useQueryClient();
  const profile = useQuery<User>({
    queryKey: ["account", "me"],
    queryFn: async () => (await api.get<User>("/users/me/")).data,
  });
  useEffect(() => {
    if (profile.data) setUser(profile.data);
  }, [profile.data, setUser]);
  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  const save = useMutation({
    mutationFn: async () => {
      if (!photo) throw new Error("Choose an image first.");
      const data = new FormData();
      data.append("profile_photo", photo);
      return (
        await api.patch<User>("/users/me/", data)
      ).data;
    },
    onSuccess: (u) => {
      setUser(u);
      setPhoto(null);
      setPreview(u.profile_photo || preview);
      toast.success("Profile picture updated");
      qc.invalidateQueries({ queryKey: ["account", "me"] });
    },
    onError: (e) => toast.error(err(e)),
  });
  const current = profile.data?.profile_photo || user?.profile_photo;
  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Profile picture"
        description="Add a clear photo so your alumni community can recognize you."
      />
      <section className="card max-w-3xl p-6 md:p-9">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="grid h-36 w-36 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/10 bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400 text-4xl font-black text-[#111326] shadow-xl">
            <ProfileAvatar
              src={preview || current}
              name={user?.name || "Alumni"}
              className="h-full w-full rounded-none"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {user?.email} · {user?.role}
            </p>
            <label className="btn btn-light mt-5 cursor-pointer">
              <Camera size={17} /> Choose photo
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!f.type.startsWith("image/")) {
                    toast.error("Please select an image.");
                    return;
                  }
                  if (f.size > 5 * 1024 * 1024) {
                    toast.error("Image must be 5 MB or smaller.");
                    return;
                  }
                  setPhoto(f);
                  setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG or WebP · max 5 MB
            </p>
          </div>
        </div>
        {profile.error && (
          <p className="mt-5 text-sm text-rose-300">
            Could not refresh account details: {err(profile.error)}
          </p>
        )}
        <div className="mt-7 flex justify-end">
          <button
            className="btn btn-primary"
            disabled={!photo || save.isPending}
            onClick={() => save.mutate()}
          >
            <Upload size={16} />
            {save.isPending ? "Uploading…" : "Save picture"}
          </button>
        </div>
      </section>
    </>
  );
}

export function GalleryPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGEMENT";
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const qc = useQueryClient();
  const gallery = useQuery({
    queryKey: ["gallery"],
    queryFn: async () =>
      list(
        (await api.get<Page<GalleryItem> | GalleryItem[]>("/gallery/")).data,
      ),
  });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select an image to upload.");
      const d = new FormData();
      d.append("image", file);
      d.append("caption", caption);
      return api.post("/gallery/", d);
    },
    onSuccess: () => {
      toast.success("Image added to the community gallery");
      setOpen(false);
      setCaption("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (e) => toast.error(err(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/gallery/${id}/`),
    onSuccess: () => {
      toast.success("Image removed");
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (e) => toast.error(err(e)),
  });
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">
            Alumni Association
          </p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
            Community gallery
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Shared moments, reunions, and memories from across the alumni
            community.
          </p>
        </div>
        <div className="flex gap-2">
          {user ? (
            <Link
              className="btn btn-light"
              to={
                user.role === "ADMIN"
                  ? "/admin/dashboard"
                  : user.role === "MANAGEMENT"
                    ? "/management/dashboard"
                    : "/alumni/dashboard"
              }
            >
              Dashboard
            </Link>
          ) : (
            <Link className="btn btn-light" to="/login">
              Sign in
            </Link>
          )}
          {canManage && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <ImagePlus size={17} /> Add image
            </button>
          )}
        </div>
      </header>
      {gallery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((x) => (
            <div
              key={x}
              className="h-72 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : gallery.error ? (
        <div className="card p-8 text-center text-rose-300">
          Gallery could not be loaded. {err(gallery.error)}
        </div>
      ) : !gallery.data?.length ? (
        <div className="card p-14 text-center">
          <ImagePlus className="mx-auto text-cyan-300" />
          <h2 className="mt-4 font-bold text-white">
            The gallery is ready for its first memory
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {canManage
              ? "Add an image to get started."
              : "Check back soon for community photos."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.data.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-white/[.08] bg-[#171a31] shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                <img
                  src={imageUrl(item.image)}
                  alt={item.caption || "Alumni community"}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                {canManage && (
                  <button
                    title="Remove image"
                    className="absolute right-3 top-3 rounded-xl bg-black/60 p-2 text-white opacity-0 transition hover:bg-rose-500 group-hover:opacity-100"
                    onClick={() =>
                      window.confirm("Remove this gallery image?") &&
                      remove.mutate(item.id)
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-white">
                  {item.caption || "Alumni community moment"}
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  {item.uploaded_by_name || "Alumni office"} ·{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171a31] p-6"
            onSubmit={(e) => {
              e.preventDefault();
              upload.mutate();
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Add gallery image
              </h2>
              <button
                type="button"
                className="text-slate-400"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <label className="mt-5 block text-sm text-slate-300">
              Photo
              <input
                required
                className="field mt-2"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <label className="mt-4 block text-sm text-slate-300">
              Caption
              <input
                className="field mt-2"
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A memorable reunion…"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!file || upload.isPending}
              >
                <Upload size={16} />
                {upload.isPending ? "Uploading…" : "Publish image"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function AlumniDirectoryPage() {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const user = useAuthStore((s) => s.user);
  const batches = useQuery({
    queryKey: ["batches", "directory"],
    queryFn: async () =>
      list((await api.get<Page<Batch> | Batch[]>("/batches/")).data),
  });
  const directory = useQuery({
    queryKey: ["alumni", "directory", search, batch],
    queryFn: async () =>
      list(
        (
          await api.get<Page<DirectoryItem> | DirectoryItem[]>(
            "/alumni/directory/",
            {
              params: {
                search: search || undefined,
                batch: batch || undefined,
              },
            },
          )
        ).data,
      ),
  });
  const sorted = useMemo(
    () =>
      [...(directory.data || [])].sort((a, b) => {
        const an = Number(a.batch?.number),
          bn = Number(b.batch?.number);
        if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn)
          return an - bn;
        return (
          (a.batch?.number || "").localeCompare(b.batch?.number || "") ||
          a.full_name.localeCompare(b.full_name)
        );
      }),
    [directory.data],
  );
  return (
    <>
      <PageHeader
        eyebrow="Alumni community"
        title="Alumni directory"
        description="Meet registered alumni, organized by batch."
        logo
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={17} />
          <input
            className="field pl-10"
            placeholder="Search alumni by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
        >
          <option value="">All batches</option>
          {batches.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.number}
              {b.year ? ` · ${b.year}` : ""}
            </option>
          ))}
        </select>
      </div>
      {directory.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((x) => (
            <div
              key={x}
              className="h-52 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : directory.error ? (
        <div className="card p-8 text-rose-300">
          Could not load directory. {err(directory.error)}
        </div>
      ) : !sorted.length ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto text-cyan-300" />
          <p className="mt-3 font-semibold text-white">No alumni found</p>
          <p className="mt-1 text-sm text-slate-400">
            Try another name or batch.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((a) => (
            <article key={a.id} className="card flex items-center gap-4 p-5">
              <ProfileAvatar
                src={a.profile_photo}
                name={a.full_name}
                className="h-20 w-20 rounded-2xl text-xl"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">
                  Batch {a.batch?.number || a.graduation_year || "—"}
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-white">
                  {a.full_name}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-400">
                  {a.company_name || "Company not listed"}
                </p>
                {a.graduation_year && (
                  <p className="mt-1 text-xs text-slate-500">
                    Graduated {a.graduation_year}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {user?.role === "ALUMNI" && (
        <p className="mt-5 text-xs text-slate-500">
          Showing registered alumni profiles.
        </p>
      )}
    </>
  );
}
