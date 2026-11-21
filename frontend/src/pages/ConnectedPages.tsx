import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useDebounce } from "../hooks/useDebounce";
import { BatchSelect } from "../components/shared/BatchSelect";
import { ProfileAvatar } from "../components/shared/ProfileAvatar";
import { PageHeader } from "../components/shared/PageHeader";
import { mediaUrl, money, dateLabel } from "../lib/utils";
import type {
  AlumniProfile,
  Batch,
  Donation,
  Event,
  Page,
  Role,
  User,
} from "../types";

type Analytics = {
  alumni_count: number;
  donation_total: number;
  donation_count: number;
  event_count: number;
  graduation_year_distribution: { graduation_year: number; count: number }[];
  donation_trend: { month: string; amount: string | number }[];
  event_attendance: {
    id: string;
    title: string;
    registered: number;
    attended: number;
  }[];
};
const array = <T,>(data: Page<T> | T[]): T[] =>
  Array.isArray(data) ? data : data?.results || [];
const message = (error: any) =>
  error?.response?.data?.detail ||
  Object.values(error?.response?.data || {})
    .flat()
    .find((x) => typeof x === "string") ||
  "Request failed. Please try again.";
function Panel({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}
function State({
  error,
  empty,
  title = "No records yet",
  action,
}: {
  error?: unknown;
  empty?: boolean;
  title?: string;
  action?: ReactNode;
}) {
  if (error)
    return (
      <Panel className="p-8 text-center">
        <h3 className="font-bold text-red-700">Couldn’t load this page</h3>
        <p className="mt-2 text-sm text-slate-500">{message(error)}</p>
      </Panel>
    );
  if (empty)
    return (
      <Panel className="p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">
          <Users />
        </div>
        <h3 className="mt-4 font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">
          Add a record or change your filters to see results.
        </p>
        {action && <div className="mt-4">{action}</div>}
      </Panel>
    );
  return null;
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        aria-modal="true"
        role="dialog"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold">{title}</h2>
          </div>
          <button
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button className="btn btn-primary" disabled={busy}>
      {busy && <LoaderCircle size={16} className="animate-spin" />}
      {label}
    </button>
  );
}

const alumniSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().optional(),
  student_id: z.string().min(1, "Student ID is required"),
  full_name: z.string().min(2, "Enter at least two characters"),
  preferred_name: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  graduation_year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(2100)
    .optional()
    .or(z.literal(0)),
  batch_id: z.string().optional(),
  nationality: z.string().optional(),
  bio: z.string().optional(),
});
type AlumniInput = z.infer<typeof alumniSchema>;
export function AlumniPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");
  const [gender, setGender] = useState("");
  const [editing, setEditing] = useState<AlumniProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const debounced = useDebounce(search, 300);
  const params = {
    search: debounced || undefined,
    graduation_year: year || undefined,
    batch: batch || undefined,
    gender: gender || undefined,
  };
  const query = useQuery({
    queryKey: ["alumni", "list", params],
    queryFn: async () =>
      array(
        (
          await api.get<Page<AlumniProfile> | AlumniProfile[]>("/alumni/", {
            params,
          })
        ).data,
      ),
  });
  const batches = useQuery({
    queryKey: ["batches", "active"],
    queryFn: async () =>
      array((await api.get<Page<Batch> | Batch[]>("/batches/")).data),
  });
  const form = useForm<z.input<typeof alumniSchema>, unknown, AlumniInput>({
    resolver: zodResolver(alumniSchema),
    defaultValues: { gender: "OTHER" },
  });
  const photoSave = useMutation({
    mutationFn: async () => {
      if (!editing || !photo) throw new Error("Choose a photo first.");
      const data = new FormData();
      data.append("profile_photo", photo);
      return api.patch(`/alumni/${editing.id}/photo/`, data);
    },
    onSuccess: () => {
      toast.success("Alumni photo updated");
      setPhoto(null);
      setPhotoPreview("");
      qc.invalidateQueries({ queryKey: ["alumni"] });
      qc.invalidateQueries({ queryKey: ["alumni", "directory"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const save = useMutation({
    mutationFn: (v: AlumniInput) => {
      if (editing) {
        const { email, password, ...profile } = v;
        return api.patch(`/alumni/${editing.id}/`, {
          ...profile,
          graduation_year: profile.graduation_year || null,
        });
      }
      if (!v.email || !v.password)
        throw new Error(
          "Enter an email and initial password to create an account.",
        );
      return api.post("/alumni/", {
        ...v,
        graduation_year: v.graduation_year || null,
      });
    },
    onSuccess: () => {
      toast.success(
        editing
          ? "Alumni profile updated"
          : "Alumni account and profile created",
      );
      close();
      qc.invalidateQueries({ queryKey: ["alumni"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/alumni/${id}/`),
    onSuccess: () => {
      toast.success("Alumni profile deleted");
      qc.invalidateQueries({ queryKey: ["alumni"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  function close() {
    setOpen(false);
    setEditing(null);
    setPhoto(null);
    setPhotoPreview("");
    form.reset({
      gender: "OTHER",
      student_id: "",
      full_name: "",
      email: "",
      password: "",
      batch_id: "",
      bio: "",
    });
  }
  function start(item?: AlumniProfile) {
    setEditing(item || null);
    setPhoto(null);
    setPhotoPreview("");
    form.reset(
      item
        ? {
            student_id: item.student_id,
            full_name: item.full_name,
            preferred_name: item.preferred_name || "",
            gender: item.gender,
            graduation_year: item.graduation_year || undefined,
            batch_id: item.batch?.id || "",
            nationality: item.nationality || "",
            bio: item.bio || "",
          }
        : {
            gender: "OTHER",
            student_id: "",
            full_name: "",
            email: "",
            password: "",
            batch_id: "",
            bio: "",
          },
    );
    setOpen(true);
  }
  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Alumni"
        description="Search, filter, and maintain graduate profiles."
        action={
          user?.role !== "ALUMNI" && (
            <button className="btn btn-primary" onClick={() => start()}>
              <Plus size={17} /> Add alumni
            </button>
          )
        }
      />
      <Panel className="p-4">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_170px_170px_140px]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className="field pl-9"
              placeholder="Search name or student ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="field"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All years</option>
            {Array.from({ length: 50 }, (_, i) => 1990 + i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select
            className="field"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option value="">All batches</option>
            {batches.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.number}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">All genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {query.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : query.error ? (
          <State error={query.error} />
        ) : !query.data?.length ? (
          <State
            empty
            title="No alumni match these filters"
            action={
              user?.role !== "ALUMNI" && (
                <button className="btn btn-primary" onClick={() => start()}>
                  Add alumni
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3">Alumni</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          src={a.profile_photo}
                          name={a.full_name}
                          className="h-10 w-10 rounded-xl text-xs"
                        />
                        <div>
                          <div className="font-bold">{a.full_name}</div>
                          <div className="text-xs text-slate-500">
                            {a.major}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{a.student_id}</td>
                    <td className="p-3">{a.batch?.number || "—"}</td>
                    <td className="p-3">{a.graduation_year || "—"}</td>
                    <td className="p-3">
                      <button
                        className="mr-3 text-xs font-bold text-teal"
                        onClick={() => start(a)}
                      >
                        View / edit
                      </button>
                      {user?.role === "ADMIN" && (
                        <button
                          aria-label="Delete alumni"
                          className="text-red-500"
                          onClick={() =>
                            window.confirm(
                              `Delete ${a.full_name}'s profile?`,
                            ) && del.mutate(a.id)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {open && (
        <Modal
          title={editing ? "Edit alumni profile" : "Create alumni account"}
          onClose={close}
        >
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
            {editing && (
              <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[.03] p-4">
                <ProfileAvatar
                  src={photoPreview || editing.profile_photo}
                  name={editing.full_name}
                  className="h-16 w-16 rounded-2xl text-lg"
                />
                <label className="min-w-[200px] flex-1">
                  <span className="label">Alumni profile photo</span>
                  <input
                    className="field"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (!f.type.startsWith("image/")) {
                        toast.error("Please select an image file.");
                        return;
                      }
                      if (f.size > 5 * 1024 * 1024) {
                        toast.error("Image must be 5 MB or smaller.");
                        return;
                      }
                      setPhoto(f);
                      setPhotoPreview(URL.createObjectURL(f));
                    }}
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    PNG, JPG or WebP · max 5 MB
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-light"
                  disabled={!photo || photoSave.isPending}
                  onClick={() => photoSave.mutate()}
                >
                  <Camera size={16} />
                  {photoSave.isPending ? "Uploading…" : "Upload photo"}
                </button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {!editing && (
                <>
                  <Field
                    label="Email"
                    error={form.formState.errors.email?.message}
                  >
                    <input
                      type="email"
                      className="field"
                      {...form.register("email")}
                    />
                  </Field>
                  <Field label="Initial password">
                    <input
                      type="password"
                      className="field"
                      {...form.register("password")}
                    />
                  </Field>
                </>
              )}
              <Field
                label="Student ID"
                error={form.formState.errors.student_id?.message}
              >
                <input className="field" {...form.register("student_id")} />
              </Field>
              <Field
                label="Full name"
                error={form.formState.errors.full_name?.message}
              >
                <input className="field" {...form.register("full_name")} />
              </Field>
              <Field label="Preferred name">
                <input className="field" {...form.register("preferred_name")} />
              </Field>
              <Field label="Gender">
                <select className="field" {...form.register("gender")}>
                  <option value="OTHER">Other</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </Field>
              <Field label="Graduation year">
                <input
                  type="number"
                  className="field"
                  {...form.register("graduation_year")}
                />
              </Field>
              <Field label="Batch">
                <BatchSelect
                  value={form.watch("batch_id")}
                  onChange={(v) => form.setValue("batch_id", v)}
                />
              </Field>
              <Field label="Nationality">
                <input className="field" {...form.register("nationality")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio">
                  <textarea
                    className="field min-h-20"
                    {...form.register("bio")}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn btn-light" onClick={close}>
                Cancel
              </button>
              <Submit
                busy={save.isPending}
                label={editing ? "Save profile" : "Create alumni"}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

const eventSchema = z.object({
  title: z.string().min(3),
  event_type: z.enum(["REUNION", "NETWORKING", "WORKSHOP", "OTHER"]),
  event_date: z.string().min(1),
  venue: z.string().min(2),
  description: z.string().optional(),
  is_published: z.boolean(),
});
type EventInput = z.infer<typeof eventSchema>;
export function EventsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Event | null>(null);
  const [open, setOpen] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null);
  const q = useQuery({
    queryKey: ["events"],
    queryFn: async () =>
      array((await api.get<Page<Event> | Event[]>("/events/")).data),
  });
  const attendeeQuery = useQuery({
    queryKey: ["events", attendanceEvent?.id, "attendees"],
    queryFn: async () =>
      (await api.get<any[]>(`/events/${attendanceEvent!.id}/attendees/`)).data,
    enabled: !!attendanceEvent,
  });
  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: { event_type: "OTHER", is_published: true },
  });
  const save = useMutation({
    mutationFn: (v: EventInput) =>
      editing
        ? api.patch(`/events/${editing.id}/`, {
            ...v,
            event_date: new Date(v.event_date).toISOString(),
          })
        : api.post("/events/", {
            ...v,
            event_date: new Date(v.event_date).toISOString(),
          }),
    onSuccess: () => {
      toast.success(editing ? "Event updated" : "Event created");
      close();
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const attendance = useMutation({
    mutationFn: ({ id, cancel }: { id: string; cancel: boolean }) =>
      api.request({
        url: `/events/${id}/${cancel ? "cancel" : "register"}/`,
        method: cancel ? "DELETE" : "POST",
      }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.cancel ? "Registration cancelled" : "You are registered",
      );
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}/`),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const markAttendance = useMutation({
    mutationFn: ({
      eventId,
      attendanceId,
      attended,
    }: {
      eventId: string;
      attendanceId: string;
      attended: boolean;
    }) =>
      api.patch(`/events/${eventId}/attendees/${attendanceId}/`, { attended }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["events", attendanceEvent?.id, "attendees"],
      });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  function close() {
    setOpen(false);
    setEditing(null);
    form.reset({
      event_type: "OTHER",
      is_published: true,
      title: "",
      event_date: "",
      venue: "",
      description: "",
    });
  }
  function start(item?: Event) {
    setEditing(item || null);
    form.reset(
      item
        ? {
            title: item.title,
            event_type: item.event_type as EventInput["event_type"],
            event_date: item.event_date.slice(0, 16),
            venue: item.venue,
            description: item.description,
            is_published: item.is_published,
          }
        : {
            title: "",
            event_type: "OTHER",
            event_date: "",
            venue: "",
            description: "",
            is_published: true,
          },
    );
    setOpen(true);
  }
  return (
    <>
      <PageHeader
        eyebrow="Community calendar"
        title="Events"
        description="Create events, manage registrations, and keep your community connected."
        action={
          user?.role !== "ALUMNI" && (
            <button className="btn btn-primary" onClick={() => start()}>
              <Plus size={16} /> Create event
            </button>
          )
        }
      />
      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((x) => (
            <Panel key={x} className="h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : q.error ? (
        <State error={q.error} />
      ) : !q.data?.length ? (
        <State
          empty
          title="No events scheduled"
          action={
            user?.role !== "ALUMNI" && (
              <button className="btn btn-primary" onClick={() => start()}>
                Create event
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((e, i) => (
            <Panel key={e.id} className="overflow-hidden">
              <div
                className={`event-cover flex h-28 items-end p-4 ${["bg-[#d5eee9]", "bg-[#e9e5fb]", "bg-[#f9e8d9]"][i % 3]}`}
              >
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                  {e.event_type.replace("_", " ")}
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-extrabold">{e.title}</h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 size={15} />
                  {dateLabel(e.event_date)}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={15} />
                  {e.venue}
                </p>
                <p className="mt-3 min-h-10 text-sm text-slate-600">
                  {e.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <span className="text-xs text-slate-500">
                    {e.registration_count || 0} registered
                  </span>
                  {user?.role === "ALUMNI" && (
                    <button
                      className="btn btn-primary !py-2"
                      onClick={() =>
                        attendance.mutate({
                          id: e.id,
                          cancel: !!e.is_registered,
                        })
                      }
                    >
                      {e.is_registered ? "Cancel registration" : "Register"}
                    </button>
                  )}
                  {user?.role !== "ALUMNI" && (
                    <div className="flex gap-3">
                      <button
                        className="text-xs font-bold text-slate-600"
                        onClick={() => setAttendanceEvent(e)}
                      >
                        Attendees
                      </button>
                      <button
                        className="text-xs font-bold text-teal"
                        onClick={() => start(e)}
                      >
                        Edit
                      </button>
                      <button
                        aria-label="Delete event"
                        className="text-red-500"
                        onClick={() =>
                          window.confirm(`Delete event “${e.title}”?`) &&
                          del.mutate(e.id)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
      {open && (
        <Modal title={editing ? "Edit event" : "Create event"} onClose={close}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event title">
                <input className="field" {...form.register("title")} />
              </Field>
              <Field label="Event type">
                <select className="field" {...form.register("event_type")}>
                  <option value="REUNION">Reunion</option>
                  <option value="NETWORKING">Networking</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Date and time">
                <input
                  type="datetime-local"
                  className="field"
                  {...form.register("event_date")}
                />
              </Field>
              <Field label="Venue">
                <input className="field" {...form.register("venue")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    className="field min-h-24"
                    {...form.register("description")}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("is_published")} />{" "}
                Publish event to alumni
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn btn-light" onClick={close}>
                Cancel
              </button>
              <Submit
                busy={save.isPending}
                label={editing ? "Save event" : "Create event"}
              />
            </div>
          </form>
        </Modal>
      )}
      {attendanceEvent && (
        <Modal
          title={`Attendees · ${attendanceEvent.title}`}
          onClose={() => setAttendanceEvent(null)}
        >
          {attendeeQuery.isLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ) : attendeeQuery.error ? (
            <p className="text-sm text-red-600">
              {message(attendeeQuery.error)}
            </p>
          ) : !attendeeQuery.data?.length ? (
            <p className="text-sm text-slate-500">No registrations yet.</p>
          ) : (
            <div className="divide-y">
              {attendeeQuery.data.map((a: any) => (
                <label
                  key={a.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span>{a.alumni_name}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={a.attended}
                      onChange={(e) =>
                        markAttendance.mutate({
                          eventId: attendanceEvent.id,
                          attendanceId: a.id,
                          attended: e.target.checked,
                        })
                      }
                    />{" "}
                    Attended
                  </span>
                </label>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export function ReportsPage() {
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get<Analytics>("/reports/analytics/")).data,
  });
  if (q.isLoading) return <Panel className="h-48 animate-pulse bg-slate-100" />;
  if (q.error) return <State error={q.error} />;
  const d = q.data!;
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Analytics & reports"
        description="Live alumni, giving, and event engagement data."
        action={
          <button className="btn btn-light" onClick={() => window.print()}>
            Print report
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Alumni</p>
          <b className="mt-3 block text-2xl">{d.alumni_count}</b>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Donations</p>
          <b className="mt-3 block text-2xl">{money(d.donation_total)}</b>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Events</p>
          <b className="mt-3 block text-2xl">{d.event_count}</b>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="font-bold">Monthly donations</h2>
          <div className="mt-4 h-64">
            {d.donation_trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.donation_trend}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => money(v)} />
                  <Area dataKey="amount" stroke="#087e8b" fill="#d7f5ed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-20 text-center text-sm text-slate-500">
                No donation data yet.
              </p>
            )}
          </div>
        </Panel>
        <Panel className="p-6">
          <h2 className="font-bold">Graduation cohorts</h2>
          <div className="mt-4 h-64">
            {d.graduation_year_distribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.graduation_year_distribution}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="graduation_year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#087e8b" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-20 text-center text-sm text-slate-500">
                No cohort data yet.
              </p>
            )}
          </div>
        </Panel>
        <Panel className="p-6 lg:col-span-2">
          <h2 className="font-bold">Event attendance</h2>
          <div className="mt-4 h-64">
            {d.event_attendance.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.event_attendance}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="title" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="registered" name="Registered" fill="#087e8b" />
                  <Bar dataKey="attended" name="Attended" fill="#f3ad62" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-20 text-center text-sm text-slate-500">
                No event data yet.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

const profileSchema = z.object({
  student_id: z.string().min(1),
  full_name: z.string().min(2),
  preferred_name: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  graduation_year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(2100)
    .optional()
    .or(z.literal(0)),
  batch_id: z.string().optional(),
  bio: z.string().optional(),
  personal_email: z.string().optional(),
  mobile_phone: z.string().optional(),
  current_city: z.string().optional(),
  current_country: z.string().optional(),
  interested_in_mentoring: z.boolean(),
  interested_in_guest_speaking: z.boolean(),
  interested_in_donating: z.boolean(),
  interested_in_volunteering: z.boolean(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  industry: z.enum(["TECHNOLOGY", "EDUCATION", "FINANCE", "OTHER"]),
  employment_status: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "SELF_EMPLOYED",
    "OTHER",
  ]),
  work_city: z.string().optional(),
  work_country: z.string().optional(),
  linkedin_url: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean(),
  gdpr_consent: z.boolean(),
  data_retention_until: z.string().optional(),
});
type ProfileInput = z.infer<typeof profileSchema>;
export function ProfilePage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const q = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => (await api.get<AlumniProfile>("/alumni/me/")).data,
  });
  const photoSave = useMutation({
    mutationFn: async () => {
      if (!photo) throw new Error("Choose an image first.");
      const data = new FormData();
      data.append("profile_photo", photo);
      return (await api.patch<User>("/users/me/", data)).data;
    },
    onSuccess: (u) => {
      setUser(u);
      setPhoto(null);
      setPhotoPreview("");
      toast.success("Profile picture updated");
      qc.invalidateQueries({ queryKey: ["alumni", "me"] });
      qc.invalidateQueries({ queryKey: ["account", "me"] });
      qc.invalidateQueries({ queryKey: ["alumni", "directory"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const form = useForm<z.input<typeof profileSchema>, unknown, ProfileInput>({
    resolver: zodResolver(profileSchema),
  });
  useEffect(() => {
    if (q.data)
      form.reset({
        student_id: q.data.student_id,
        full_name: q.data.full_name,
        preferred_name: q.data.preferred_name || "",
        gender: q.data.gender,
        date_of_birth: q.data.date_of_birth || "",
        nationality: q.data.nationality || "",
        graduation_year: q.data.graduation_year || 0,
        batch_id: q.data.batch?.id || "",
        bio: q.data.bio || "",
        personal_email: q.data.contact?.personal_email || "",
        mobile_phone: q.data.contact?.mobile_phone || "",
        current_city: q.data.contact?.current_city || "",
        current_country: q.data.contact?.current_country || "",
        interested_in_mentoring:
          (q.data as any).engagement_preference?.interested_in_mentoring ||
          false,
        interested_in_guest_speaking:
          (q.data as any).engagement_preference?.interested_in_guest_speaking ||
          false,
        interested_in_donating:
          (q.data as any).engagement_preference?.interested_in_donating ||
          false,
        interested_in_volunteering:
          (q.data as any).engagement_preference?.interested_in_volunteering ||
          false,
        company_name: (q.data.employments?.[0] as any)?.company_name || "",
        job_title: (q.data.employments?.[0] as any)?.job_title || "",
        industry: (q.data.employments?.[0] as any)?.industry || "OTHER",
        employment_status:
          (q.data.employments?.[0] as any)?.employment_status || "FULL_TIME",
        work_city: (q.data.employments?.[0] as any)?.work_city || "",
        work_country: (q.data.employments?.[0] as any)?.work_country || "",
        linkedin_url: (q.data.employments?.[0] as any)?.linkedin_url || "",
        start_date: (q.data.employments?.[0] as any)?.start_date || "",
        end_date: (q.data.employments?.[0] as any)?.end_date || "",
        is_current: (q.data.employments?.[0] as any)?.is_current || false,
        gdpr_consent: (q.data as any).consent?.gdpr_consent || false,
        data_retention_until:
          (q.data as any).consent?.data_retention_until || "",
      });
  }, [q.data, form]);
  const save = useMutation({
    mutationFn: (v: ProfileInput) =>
      api.patch(`/alumni/${q.data!.id}/`, {
        student_id: v.student_id,
        full_name: v.full_name,
        preferred_name: v.preferred_name,
        gender: v.gender,
        date_of_birth: v.date_of_birth || null,
        nationality: v.nationality,
        graduation_year: v.graduation_year || null,
        batch_id: v.batch_id || null,
        bio: v.bio,
        contact: {
          personal_email: v.personal_email,
          mobile_phone: v.mobile_phone,
          current_city: v.current_city,
          current_country: v.current_country,
        },
        engagement_preference: {
          interested_in_mentoring: v.interested_in_mentoring,
          interested_in_guest_speaking: v.interested_in_guest_speaking,
          interested_in_donating: v.interested_in_donating,
          interested_in_volunteering: v.interested_in_volunteering,
        },
        employments:
          v.company_name || v.job_title
            ? [
                {
                  company_name: v.company_name || "",
                  job_title: v.job_title || "",
                  industry: v.industry,
                  employment_status: v.employment_status,
                  work_city: v.work_city || "",
                  work_country: v.work_country || "",
                  linkedin_url: v.linkedin_url || "",
                  start_date: v.start_date || null,
                  end_date: v.end_date || null,
                  is_current: v.is_current,
                },
              ]
            : [],
        consent: {
          gdpr_consent: v.gdpr_consent,
          data_retention_until: v.data_retention_until || null,
          consent_date: v.gdpr_consent ? new Date().toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["alumni", "me"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  if (q.isLoading) return <Panel className="h-48 animate-pulse bg-slate-100" />;
  if (q.error) return <State error={q.error} />;
  if (!q.data) return <State empty title="Alumni profile not found" />;
  const p = q.data;
  const displayedPhoto =
    photoPreview || mediaUrl(user?.profile_photo) || mediaUrl(p.profile_photo);
  return (
    <>
      <PageHeader
        eyebrow="Your community profile"
        title="My profile"
        description="Keep your education, contact, and interests current."
        action={
          !editing && (
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit profile
            </button>
          )
        }
      />
      <Panel className="max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-mint text-xl font-bold text-teal">
            {displayedPhoto ? (
              <img
                src={displayedPhoto}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              p.full_name.slice(0, 1)
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold">{p.full_name}</h2>
            <p className="text-sm text-slate-500">
              {p.student_id} · {p.graduation_year || "Graduation year not set"}
            </p>
          </div>
        </div>
        {editing ? (
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
            <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4">
              <label className="min-w-[220px] flex-1">
                <span className="label">Profile photo</span>
                <input
                  className="field"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (!f.type.startsWith("image/")) {
                      toast.error("Please select an image file.");
                      return;
                    }
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error("Image must be 5 MB or smaller.");
                      return;
                    }
                    setPhoto(f);
                    setPhotoPreview(URL.createObjectURL(f));
                  }}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  PNG, JPG or WebP · max 5 MB
                </span>
              </label>
              <button
                type="button"
                className="btn btn-light"
                disabled={!photo || photoSave.isPending}
                onClick={() => photoSave.mutate()}
              >
                <Camera size={16} />
                {photoSave.isPending ? "Uploading…" : "Upload photo"}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className="field" {...form.register("full_name")} />
              </Field>
              <Field label="Preferred name">
                <input className="field" {...form.register("preferred_name")} />
              </Field>
              <Field label="Student ID">
                <input className="field" {...form.register("student_id")} />
              </Field>
              <Field label="Gender">
                <select className="field" {...form.register("gender")}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Graduation year">
                <input
                  type="number"
                  className="field"
                  {...form.register("graduation_year")}
                />
              </Field>
              <Field label="Batch">
                <BatchSelect
                  value={form.watch("batch_id")}
                  onChange={(v) => form.setValue("batch_id", v)}
                />
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  className="field"
                  {...form.register("date_of_birth")}
                />
              </Field>
              <Field label="Nationality">
                <input className="field" {...form.register("nationality")} />
              </Field>
              <Field label="Personal email">
                <input
                  type="email"
                  className="field"
                  {...form.register("personal_email")}
                />
              </Field>
              <Field label="Mobile phone">
                <input className="field" {...form.register("mobile_phone")} />
              </Field>
              <Field label="Current city">
                <input className="field" {...form.register("current_city")} />
              </Field>
              <Field label="Current country">
                <input
                  className="field"
                  {...form.register("current_country")}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio">
                  <textarea
                    className="field min-h-24"
                    {...form.register("bio")}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-6 border-t pt-5">
              <h3 className="mb-4 font-bold">Employment</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company">
                  <input className="field" {...form.register("company_name")} />
                </Field>
                <Field label="Job title">
                  <input className="field" {...form.register("job_title")} />
                </Field>
                <Field label="Industry">
                  <select className="field" {...form.register("industry")}>
                    <option value="OTHER">Other</option>
                    <option value="TECHNOLOGY">Technology</option>
                    <option value="EDUCATION">Education</option>
                    <option value="FINANCE">Finance</option>
                  </select>
                </Field>
                <Field label="Employment status">
                  <select
                    className="field"
                    {...form.register("employment_status")}
                  >
                    <option value="FULL_TIME">Full time</option>
                    <option value="PART_TIME">Part time</option>
                    <option value="SELF_EMPLOYED">Self employed</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Work city">
                  <input className="field" {...form.register("work_city")} />
                </Field>
                <Field label="Work country">
                  <input className="field" {...form.register("work_country")} />
                </Field>
                <Field label="LinkedIn URL">
                  <input className="field" {...form.register("linkedin_url")} />
                </Field>
                <Field label="Start date">
                  <input
                    type="date"
                    className="field"
                    {...form.register("start_date")}
                  />
                </Field>
                <Field label="End date">
                  <input
                    type="date"
                    className="field"
                    {...form.register("end_date")}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register("is_current")} />{" "}
                  Current position
                </label>
              </div>
            </div>
            <div className="mt-6 border-t pt-5">
              <h3 className="mb-3 font-bold">Community interests</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    "interested_in_mentoring",
                    "interested_in_guest_speaking",
                    "interested_in_donating",
                    "interested_in_volunteering",
                  ] as const
                ).map((k) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register(k)} />
                    {k.replace("interested_in_", "").replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-5 border-t pt-4">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" {...form.register("gdpr_consent")} /> I
                consent to the alumni office storing and using my profile data
                for community engagement.
              </label>
              <Field label="Data retention until">
                <input
                  type="date"
                  className="field"
                  {...form.register("data_retention_until")}
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <Submit busy={save.isPending} label="Save profile" />
            </div>
          </form>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="label">Major</p>
              <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                Computer Science
              </span>
            </div>
            <div>
              <p className="label">Batch</p>
              <span className="text-sm font-semibold">
                {p.batch?.number || "Not assigned"}
              </span>
            </div>
            <div>
              <p className="label">Contact</p>
              <p className="text-sm">
                {p.contact?.personal_email || "No email"} ·{" "}
                {p.contact?.mobile_phone || "No phone"}
              </p>
            </div>
            <div>
              <p className="label">Location</p>
              <p className="text-sm">
                {[p.contact?.current_city, p.contact?.current_country]
                  .filter(Boolean)
                  .join(", ") || "Not provided"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="label">About</p>
              <p className="text-sm leading-6 text-slate-600">
                {p.bio || "Tell your alumni community about your journey."}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="label">Employment</p>
              {p.employments?.length ? (
                <ul className="space-y-2">
                  {(p.employments as any[]).map((e, i) => (
                    <li key={e.id || i} className="text-sm">
                      {e.job_title} · {e.company_name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No employment details added.
                </p>
              )}
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}

const userSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGEMENT", "ALUMNI"]),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});
type UserInput = z.infer<typeof userSchema>;
export function UsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["users"],
    queryFn: async () =>
      array((await api.get<Page<User> | User[]>("/users/")).data),
  });
  const form = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "ALUMNI" },
  });
  const create = useMutation({
    mutationFn: (v: UserInput) => api.post("/users/", v),
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      form.reset({ role: "ALUMNI" });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}/`),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(message(e)),
  });
  async function changeRole(u: User, role: Role) {
    try {
      await api.patch(`/users/${u.id}/role-change/`, { role });
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      toast.error(message(e));
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Users"
        description="Create accounts, update roles, and remove access."
        action={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Add user
          </button>
        }
      />
      {q.isLoading ? (
        <Panel className="h-40 animate-pulse bg-slate-100" />
      ) : q.error ? (
        <State error={q.error} />
      ) : !q.data?.length ? (
        <State empty title="No accounts" />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Verified</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((u) => (
                <tr className="border-t" key={u.id}>
                  <td className="p-4 font-bold">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <select
                      aria-label={`Role for ${u.email}`}
                      className="field max-w-[170px]"
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                    >
                      {(["ADMIN", "MANAGEMENT", "ALUMNI"] as Role[]).map(
                        (r) => (
                          <option key={r}>{r}</option>
                        ),
                      )}
                    </select>
                  </td>
                  <td className="p-4">
                    {u.is_verified ? "Verified" : "Unverified"}
                  </td>
                  <td className="p-4">
                    <button
                      disabled={u.id === useAuthStore.getState().user?.id}
                      className="text-red-500 disabled:opacity-40"
                      aria-label="Delete user"
                      onClick={() =>
                        window.confirm(`Delete account ${u.email}?`) &&
                        del.mutate(u.id)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {open && (
        <Modal title="Create user account" onClose={() => setOpen(false)}>
          <form
            onSubmit={form.handleSubmit((v) => create.mutate(v))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  className="field"
                  {...form.register("email")}
                />
              </Field>
              <Field label="Username">
                <input className="field" {...form.register("username")} />
              </Field>
              <Field label="Initial password">
                <input
                  type="password"
                  className="field"
                  {...form.register("password")}
                />
              </Field>
              <Field label="Role">
                <select className="field" {...form.register("role")}>
                  <option value="ALUMNI">Alumni</option>
                  <option value="MANAGEMENT">Management</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
              <Field label="First name">
                <input className="field" {...form.register("first_name")} />
              </Field>
              <Field label="Last name">
                <input className="field" {...form.register("last_name")} />
              </Field>
              <Field label="Phone">
                <input className="field" {...form.register("phone")} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <Submit busy={create.isPending} label="Create user" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get<Analytics>("/reports/analytics/")).data,
    enabled: user?.role !== "ALUMNI",
  });
  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () =>
      array((await api.get<Page<Event> | Event[]>("/events/")).data),
  });
  const batches = useQuery({
    queryKey: ["batches", "active"],
    queryFn: async () =>
      array((await api.get<Page<Batch> | Batch[]>("/batches/")).data),
  });
  const profile = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => (await api.get<AlumniProfile>("/alumni/me/")).data,
    enabled: user?.role === "ALUMNI",
  });
  const donations = useQuery({
    queryKey: ["donations", "own"],
    queryFn: async () =>
      array(
        (await api.get<Page<Donation> | Donation[]>("/donations/my-donations/"))
          .data,
      ),
    enabled: user?.role === "ALUMNI",
  });
  if (q.isLoading || events.isLoading || profile.isLoading)
    return <Panel className="h-44 animate-pulse bg-slate-100" />;
  if (q.error && user?.role !== "ALUMNI") return <State error={q.error} />;
  const data = q.data;
  const total =
    donations.data?.reduce(
      (s, d) => (d.status === "RECEIVED" ? s + Number(d.amount) : s),
      0,
    ) || 0;
  return (
    <>
      <PageHeader
        eyebrow="Community overview"
        title={`Welcome, ${user?.name?.split(" ")[0] || "alumni"}.`}
        description="A live snapshot of your alumni community."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-5">
          <p className="text-sm text-slate-500">
            {user?.role === "ALUMNI" ? "My profile" : "Alumni"}
          </p>
          <b className="mt-3 block text-2xl">
            {user?.role === "ALUMNI"
              ? profile.data?.full_name
                ? "Active"
                : "Setup needed"
              : data?.alumni_count || 0}
          </b>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Events</p>
          <b className="mt-3 block text-2xl">{events.data?.length || 0}</b>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">
            {user?.role === "ALUMNI" ? "My giving" : "Community giving"}
          </p>
          <b className="mt-3 block text-2xl">
            {user?.role === "ALUMNI"
              ? money(total)
              : money(data?.donation_total || 0)}
          </b>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Active batches</p>
          <b className="mt-3 block text-2xl">{batches.data?.length || 0}</b>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="font-bold">Graduation year distribution</h2>
          <div className="mt-4 h-64">
            {data?.graduation_year_distribution?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.graduation_year_distribution}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="graduation_year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#087e8b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-20 text-center text-sm text-slate-500">
                No alumni distribution data.
              </p>
            )}
          </div>
        </Panel>
        <Panel className="p-6">
          <h2 className="font-bold">Recent events</h2>
          {events.error ? (
            <p className="mt-3 text-sm text-red-600">{message(events.error)}</p>
          ) : events.data?.length ? (
            <div className="mt-3 divide-y">
              {events.data.slice(0, 5).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <b className="text-sm">{e.title}</b>
                    <p className="mt-1 text-xs text-slate-500">
                      {dateLabel(e.event_date)} · {e.venue}
                    </p>
                  </div>
                  <CalendarDays className="text-teal" size={18} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              No events scheduled.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
