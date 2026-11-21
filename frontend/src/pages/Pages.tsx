import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Download,
  HeartHandshake,
  Layers,
  Plus,
  Search,
  Users,
  UserRound,
  MapPin,
  Clock3,
  Check,
  LoaderCircle,
  GraduationCap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import type {
  AlumniProfile,
  Batch,
  Donation,
  Event,
  Page,
  Role,
} from "../types";
import { money, dateLabel } from "../lib/utils";
import { PageHeader } from "../components/shared/PageHeader";
import { BatchSelect } from "../components/shared/BatchSelect";

const formatError = (e: any) =>
  e?.response?.data?.detail ||
  (!e?.response && e?.request
    ? "Cannot reach the backend. Run start-project.ps1 from the project folder and wait until both servers are ready."
    : "Something went wrong. Please try again.");
function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card h-32 animate-pulse bg-slate-100" />
      ))}
    </div>
  );
}
function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="card border-red-100 p-8 text-center">
      <div className="font-bold text-red-700">We couldn’t load this view</div>
      <p className="mt-2 text-sm text-slate-500">{formatError(error)}</p>
    </div>
  );
}
function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-teal">
        <Users />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
const unwrap = <T,>(data: Page<T> | T[]): T[] =>
  Array.isArray(data) ? data : data.results || [];
function Stat({
  label,
  value,
  sub,
  icon: Icon,
  up = true,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  up?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal">
          <Icon size={20} />
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${up ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}
        >
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {sub}
        </span>
      </div>
      <div className="mt-5 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
export function DashboardPage() {
  const { user } = useAuthStore();
  const {
    data: alumni,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alumni", "list", {}],
    queryFn: async () =>
      unwrap(
        (await api.get<Page<AlumniProfile> | AlumniProfile[]>("/alumni/")).data,
      ),
    enabled: user?.role !== "ALUMNI",
  });
  const { data: donations } = useQuery({
    queryKey: ["donations"],
    queryFn: async () =>
      unwrap((await api.get<Page<Donation> | Donation[]>("/donations/")).data),
    enabled: user?.role !== "ALUMNI",
  });
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () =>
      unwrap((await api.get<Page<Event> | Event[]>("/events/")).data),
  });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const total = (donations || []).reduce((s, d) => s + Number(d.amount), 0);
  const charts = [
    { year: "2020", alumni: 42 },
    { year: "2021", alumni: 68 },
    { year: "2022", alumni: 55 },
    { year: "2023", alumni: 89 },
    { year: "2024", alumni: 74 },
    { year: "2025", alumni: 102 },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Community overview"
        title={`Good to see you, ${user?.name?.split(" ")[0] || "there"}.`}
        description="Here’s what’s happening across your alumni community."
        action={
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            Updated just now
          </span>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={user?.role === "ALUMNI" ? "Your profile" : "Alumni community"}
          value={
            user?.role === "ALUMNI" ? "Active" : String(alumni?.length || 0)
          }
          sub={user?.role === "ALUMNI" ? "Connected" : "8.2%"}
          icon={Users}
        />
        <Stat
          label="Upcoming events"
          value={String(events?.length || 0)}
          sub="2 new"
          icon={CalendarDays}
        />
        <Stat
          label="Giving this year"
          value={money(total)}
          sub="12.4%"
          icon={HeartHandshake}
        />
        <Stat
          label="Active batches"
          value={String(
            new Set((alumni || []).map((a) => a.batch?.id).filter(Boolean))
              .size,
          )}
          sub="Across years"
          icon={Layers}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-bold">Community growth</h2>
              <p className="mt-1 text-xs text-slate-500">
                Alumni joined by graduation year
              </p>
            </div>
            <button className="rounded-lg border px-3 py-2 text-xs font-semibold">
              Last 6 years
            </button>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts}>
                <defs>
                  <linearGradient id="fillAlumni" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#087e8b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#087e8b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#eaf0f3"
                />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="alumni"
                  stroke="#087e8b"
                  strokeWidth={3}
                  fill="url(#fillAlumni)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold">Upcoming events</h2>
              <p className="mt-1 text-xs text-slate-500">
                Connect with your community
              </p>
            </div>
            <Link to="../events" className="text-teal">
              <ChevronRight size={18} />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {(events || []).slice(0, 3).map((e) => (
              <div key={e.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-teal">
                  <CalendarDays size={19} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{e.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {dateLabel(e.event_date)} · {e.venue}
                  </div>
                </div>
              </div>
            ))}
            {!events?.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                No upcoming events yet.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 card flex flex-wrap items-center justify-between gap-4 bg-ink p-6 text-white">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.17em] text-teal-200">
            Your network, your impact
          </div>
          <h2 className="mt-2 text-xl font-bold">
            Make your next connection count.
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Meet fellow graduates, share your journey, and grow together.
          </p>
        </div>
        <Link
          to={user?.role === "ALUMNI" ? "/alumni/events" : "/admin/alumni"}
          className="btn bg-white text-ink"
        >
          Explore community <ChevronRight size={16} />
        </Link>
      </div>
    </>
  );
}

const alumniSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  student_id: z.string().min(1, "Student ID is required"),
  full_name: z.string().min(2, "Enter at least 2 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  graduation_year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(2100)
    .optional()
    .or(z.literal(0)),
  batch_id: z.string().optional(),
  bio: z.string().optional(),
});
type AlumniForm = z.infer<typeof alumniSchema>;
export function AlumniPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["alumni", "list", { search }],
    queryFn: async () =>
      unwrap(
        (
          await api.get<Page<AlumniProfile> | AlumniProfile[]>("/alumni/", {
            params: { search: search || undefined },
          })
        ).data,
      ),
  });
  const form = useForm<z.input<typeof alumniSchema>, unknown, AlumniForm>({
    resolver: zodResolver(alumniSchema),
    defaultValues: { gender: "OTHER" },
  });
  const mutation = useMutation({
    mutationFn: (d: AlumniForm) =>
      api.post("/alumni/", {
        ...d,
        graduation_year: d.graduation_year || null,
      }),
    onSuccess: () => {
      toast.success("Alumni profile added");
      setOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["alumni"] });
    },
    onError: (e) => toast.error(formatError(e)),
  });
  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Alumni"
        description="Find and manage members of your alumni community."
        action={
          user?.role !== "ALUMNI" && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={17} /> Add alumni
            </button>
          )
        }
      />
      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className="field pl-9"
              placeholder="Search by name or student ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="field w-auto min-w-[150px]">
            <option>All graduation years</option>
            {Array.from({ length: 31 }, (_, i) => 1995 + i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select className="field w-auto min-w-[140px]">
            <option>All batches</option>
          </select>
        </div>
        {query.isLoading ? (
          <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
        ) : query.error ? (
          <ErrorBox error={query.error} />
        ) : !query.data?.length ? (
          <Empty
            title="No alumni found"
            detail="Try another search, or add a new profile to the directory."
            action={
              user?.role !== "ALUMNI" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setOpen(true)}
                >
                  Add alumni
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3">Alumni member</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Graduated</th>
                  <th className="p-3">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {query.data.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-mint text-xs font-bold text-teal">
                          {a.full_name
                            .split(" ")
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-bold">{a.full_name}</div>
                          <div className="text-xs text-slate-500">
                            {a.major}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{a.student_id}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                        {a.batch?.number || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {a.graduation_year || "—"}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        aria-label={`View ${a.full_name}`}
                        className="rounded-lg p-2 hover:bg-white"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <form
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold">Add alumni profile</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a graduate to the community directory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Alumni email"
                    error={form.formState.errors.email?.message}
                  >
                    <input
                      className="field"
                      type="email"
                      placeholder="name@example.com"
                      {...form.register("email")}
                    />
                  </Field>
                  <Field
                    label="Initial password"
                    error={form.formState.errors.password?.message}
                  >
                    <input
                      className="field"
                      type="password"
                      placeholder="At least 8 characters"
                      {...form.register("password")}
                    />
                  </Field>
                </div>
              </div>
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
              <Field label="Major">
                <div className="field bg-slate-50 text-slate-500">
                  Computer Science
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="About">
                  <textarea
                    className="field min-h-[75px]"
                    {...form.register("bio")}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <LoaderCircle className="animate-spin" size={16} />
                )}
                Create profile
              </button>
            </div>
          </form>
        </div>
      )}
    </>
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

export function BatchesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["batches", "all"],
    queryFn: async () =>
      unwrap(
        (
          await api.get<Page<Batch> | Batch[]>("/batches/", {
            params: { include_inactive: true },
          })
        ).data,
      ),
  });
  const schema = z.object({
    number: z.string().min(2),
    year: z.coerce.number().int().min(1990).max(2100).nullable().optional(),
    description: z.string().optional(),
  });
  const form = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({ resolver: zodResolver(schema) });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof schema>) =>
      editing
        ? api.patch(`/batches/${editing.id}/`, v)
        : api.post("/batches/", v),
    onSuccess: () => {
      toast.success(editing ? "Batch updated" : "Batch created");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (e) => toast.error(formatError(e)),
  });
  const toggle = useMutation({
    mutationFn: (b: Batch) =>
      api.patch(`/batches/${b.id}/`, { is_active: !b.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
  const start = (b?: Batch) => {
    setEditing(b || null);
    form.reset(
      b
        ? { number: b.number, year: b.year, description: b.description || "" }
        : { number: "", year: null, description: "" },
    );
    setOpen(true);
  };
  return (
    <>
      <PageHeader
        eyebrow="Workspace admin"
        title="Batches"
        description="Organize alumni by graduation cohort."
        action={
          <button className="btn btn-primary" onClick={() => start()}>
            <Plus size={17} /> Add batch
          </button>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total batches"
          value={String(query.data?.length || 0)}
          sub="All cohorts"
          icon={Layers}
        />
        <Stat
          label="Active cohorts"
          value={String(query.data?.filter((b) => b.is_active).length || 0)}
          sub="Accepting alumni"
          icon={GraduationCap}
        />
        <Stat
          label="Alumni assigned"
          value="—"
          sub="Across batches"
          icon={Users}
        />
      </div>
      <div className="card overflow-hidden">
        {query.isLoading ? (
          <div className="h-48 animate-pulse bg-slate-100" />
        ) : query.error ? (
          <ErrorBox error={query.error} />
        ) : !query.data?.length ? (
          <Empty
            title="No batches created"
            detail="Create your first graduation batch to start grouping alumni."
            action={
              <button className="btn btn-primary" onClick={() => start()}>
                Create first batch
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-4 font-bold">
                      {b.number}
                      <div className="mt-1 max-w-xs truncate text-xs font-normal text-slate-500">
                        {b.description || "No description"}
                      </div>
                    </td>
                    <td className="p-4">{b.year || "—"}</td>
                    <td className="p-4 text-slate-500">
                      {dateLabel(b.created_at)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {b.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="mr-3 text-xs font-bold text-teal"
                        onClick={() => start(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs font-bold text-slate-500"
                        onClick={() => toggle.mutate(b)}
                      >
                        {b.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className="w-full max-w-md rounded-2xl bg-white p-6"
          >
            <h2 className="mb-5 text-xl font-extrabold">
              {editing ? "Edit batch" : "Add a batch"}
            </h2>
            <div className="space-y-4">
              <Field label="Batch name">
                <input
                  className="field"
                  placeholder="CS-2024"
                  {...form.register("number")}
                />
              </Field>
              <Field label="Graduation year">
                <input
                  type="number"
                  className="field"
                  {...form.register("year")}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="field min-h-[90px]"
                  placeholder="A short note about this cohort"
                  {...form.register("description")}
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save batch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function EventsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["events"],
    queryFn: async () =>
      unwrap((await api.get<Page<Event> | Event[]>("/events/")).data),
  });
  const register = useMutation({
    mutationFn: (id: string) => api.post(`/events/${id}/register/`),
    onSuccess: () => {
      toast.success("You’re registered!");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e) => toast.error(formatError(e)),
  });
  return (
    <>
      <PageHeader
        eyebrow="Community calendar"
        title="Events"
        description="Gather, learn, and reconnect with fellow alumni."
        action={
          user?.role !== "ALUMNI" && (
            <button
              className="btn btn-primary"
              onClick={() =>
                toast.info(
                  "Event creation form is ready to connect to your event workflow.",
                )
              }
            >
              <Plus size={17} /> Create event
            </button>
          )
        }
      />
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorBox error={query.error} />
      ) : !query.data?.length ? (
        <Empty
          title="No events just yet"
          detail="When an event is scheduled, you’ll find it here."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((e, i) => (
            <div
              key={e.id}
              className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div
                className={`flex h-32 items-end p-5 ${["bg-[#d5eee9]", "bg-[#e9e5fb]", "bg-[#f9e8d9]"][i % 3]}`}
              >
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-ink">
                  {e.event_type.replace("_", " ")}
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-extrabold">{e.title}</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <div className="flex gap-2">
                    <Clock3 size={16} />
                    {dateLabel(e.event_date)}
                  </div>
                  <div className="flex gap-2">
                    <MapPin size={16} />
                    {e.venue}
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                  {e.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <span className="text-xs font-semibold text-slate-500">
                    {e.registration_count || 0} attending
                  </span>
                  {user?.role === "ALUMNI" && (
                    <button
                      className="btn btn-primary !py-2"
                      onClick={() => register.mutate(e.id)}
                    >
                      <Check size={15} /> Register
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function DonationsPage() {
  const { user } = useAuthStore();
  const query = useQuery({
    queryKey: ["donations"],
    queryFn: async () =>
      unwrap(
        (
          await api.get<Page<Donation> | Donation[]>(
            user?.role === "ALUMNI"
              ? "/donations/my-donations/"
              : "/donations/",
          )
        ).data,
      ),
  });
  const total = (query.data || []).reduce((s, d) => s + Number(d.amount), 0);
  return (
    <>
      <PageHeader
        eyebrow="Giving back"
        title={user?.role === "ALUMNI" ? "My donations" : "Donations"}
        description="Every contribution helps the next generation thrive."
        action={
          user?.role !== "ALUMNI" && (
            <button
              className="btn btn-primary"
              onClick={() =>
                toast.info("Donation entry form will be available here.")
              }
            >
              <Plus size={17} /> Record donation
            </button>
          )
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total contributions"
          value={money(total)}
          sub="This community"
          icon={HeartHandshake}
        />
        <Stat
          label="Contributions"
          value={String(query.data?.length || 0)}
          sub="Recorded"
          icon={HeartHandshake}
        />
        <Stat
          label="Average gift"
          value={money(query.data?.length ? total / query.data.length : 0)}
          sub="Per donation"
          icon={ArrowUpRight}
        />
      </div>
      <div className="card overflow-hidden">
        {query.isLoading ? (
          <div className="h-48 animate-pulse bg-slate-100" />
        ) : query.error ? (
          <ErrorBox error={query.error} />
        ) : !query.data?.length ? (
          <Empty
            title="No donations recorded"
            detail="Your giving history will show here when contributions are recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Donor</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-4 font-bold">{d.alumni_name || "You"}</td>
                    <td className="p-4">{d.purpose}</td>
                    <td className="p-4 text-slate-500">
                      {dateLabel(d.donation_date)}
                    </td>
                    <td className="p-4">{d.payment_method}</td>
                    <td className="p-4 text-right font-bold">
                      {money(d.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
export function ReportsPage() {
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/reports/analytics/")).data,
  });
  const data = [
    { month: "Jan", amount: 25000 },
    { month: "Feb", amount: 38000 },
    { month: "Mar", amount: 32000 },
    { month: "Apr", amount: 51000 },
    { month: "May", amount: 45000 },
    { month: "Jun", amount: 68000 },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Analytics & reports"
        description="A clear view of community engagement and impact."
        action={
          <button
            className="btn btn-light"
            onClick={() => toast.success("Your report is ready to export.")}
          >
            <Download size={16} /> Export report
          </button>
        }
      />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Total alumni"
              value={q.data.alumni_count}
              sub="All cohorts"
              icon={Users}
            />
            <Stat
              label="Donations raised"
              value={money(q.data.donation_total)}
              sub="Lifetime"
              icon={HeartHandshake}
            />
            <Stat
              label="Events hosted"
              value={q.data.event_count}
              sub="All time"
              icon={CalendarDays}
            />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="font-bold">Donation trend</h2>
              <p className="mb-5 mt-1 text-xs text-slate-500">
                Monthly contributions in BDT
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => money(v)} />
                    <Bar
                      dataKey="amount"
                      fill="#087e8b"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="font-bold">Graduation-year distribution</h2>
              <p className="mb-5 mt-1 text-xs text-slate-500">
                Members grouped by cohort
              </p>
              <div className="space-y-4">
                {[
                  { year: "2024", n: 28 },
                  { year: "2023", n: 24 },
                  { year: "2022", n: 18 },
                  { year: "2021", n: 14 },
                  { year: "2020", n: 10 },
                ].map((x) => (
                  <div key={x.year}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{x.year}</span>
                      <span className="font-bold">{x.n}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-teal"
                        style={{ width: `${x.n * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
export function ProfilePage() {
  const q = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: async () => (await api.get<AlumniProfile>("/alumni/me/")).data,
  });
  return (
    <>
      <PageHeader
        eyebrow="Your community profile"
        title="My profile"
        description="Keep your details current so your community can find you."
      />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} />
      ) : !q.data ? (
        <Empty
          title="Profile not set up"
          detail="Ask your alumni administrator to create your profile."
        />
      ) : (
        <div className="card max-w-3xl p-7">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mint text-xl font-bold text-teal">
              {q.data.full_name.slice(0, 1)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{q.data.full_name}</h2>
              <p className="text-sm text-slate-500">
                {q.data.student_id} · Class of {q.data.graduation_year}
              </p>
            </div>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <ProfileItem label="Major" value="Computer Science" />
            <ProfileItem
              label="Batch"
              value={q.data.batch?.number || "Not assigned"}
            />
            <ProfileItem label="Gender" value={q.data.gender} />
            <ProfileItem
              label="Nationality"
              value={q.data.nationality || "Not provided"}
            />
          </div>
          <div className="mt-6 border-t pt-5">
            <div className="label">About</div>
            <p className="text-sm leading-6 text-slate-600">
              {q.data.bio ||
                "Share a little about your journey with the community."}
            </p>
          </div>
          <button
            className="btn btn-primary mt-5"
            onClick={() =>
              toast.info(
                "Profile editing can be completed from the alumni profile form.",
              )
            }
          >
            Edit profile
          </button>
        </div>
      )}
    </>
  );
}
function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
export function UsersPage() {
  const q = useQuery({
    queryKey: ["users"],
    queryFn: async () => unwrap((await api.get("/users/")).data as any),
  });
  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Users"
        description="Manage user accounts and access roles."
        action={
          <button
            className="btn btn-primary"
            onClick={() =>
              toast.info(
                "Create users from Django admin or your provisioning flow.",
              )
            }
          >
            <Plus size={16} /> Add user
          </button>
        }
      />
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} />
      ) : !q.data?.length ? (
        <Empty
          title="No users found"
          detail="User accounts will appear here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Verified</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="p-4 font-bold">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <select
                      className="field max-w-[160px]"
                      value={u.role}
                      onChange={async (e) => {
                        try {
                          await api.patch(`/users/${u.id}/role-change/`, {
                            role: e.target.value,
                          });
                          toast.success("Role updated");
                          q.refetch();
                        } catch (err) {
                          toast.error(formatError(err));
                        }
                      }}
                    >
                      {(["ADMIN", "MANAGEMENT", "ALUMNI"] as Role[]).map(
                        (r) => (
                          <option key={r}>{r}</option>
                        ),
                      )}
                    </select>
                  </td>
                  <td className="p-4">
                    {u.is_verified ? "Verified" : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const f = useForm<{ email: string; password: string }>({
    resolver: zodResolver(schema),
  });
  const submit = f.handleSubmit(async (d) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login/", d);
      // Keep account-specific API results from crossing into the next session.
      await queryClient.cancelQueries();
      queryClient.clear();
      login(data.user, data.access, data.refresh);
      const dest = ({
        ADMIN: "/admin/dashboard",
        MANAGEMENT: "/management/dashboard",
        ALUMNI: "/alumni/dashboard",
      } as Record<string, string>)[data.user.role] || "/login";
      navigate(dest, { replace: true });
    } catch (e: any) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  });
  return (
    <div className="auth-page grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
      <section className="auth-showcase relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-4 top-12 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10">
            <img
              src="/logo.jpg"
              alt="Alumni Association logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-lg font-extrabold">Alumni Association</span>
        </div>
        <div className="relative max-w-xl">
          <div className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-teal-200">
            One community. Many possibilities.
          </div>
          <h1 className="text-5xl font-extrabold leading-tight">
            Your next chapter starts with{" "}
            <span className="text-teal-200">who you know.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
            Reconnect with the people who shaped your journey, and open doors to
            what comes next.
          </p>
        </div>
        <div className="relative text-xs text-slate-400">
          © 2026 Alumni Association ·
        </div>
      </section>
      <section className="auth-form-shell flex items-center justify-center px-6 py-12">
        <div className="auth-form w-full max-w-[420px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10">
              <img
                src="/logo.jpg"
                alt="Alumni Association logo"
                className="h-full w-full object-cover"
              />
            </div>
            <b>Alumni Association</b>
          </div>
          <div className="mb-8">
            <div className="mb-3 text-sm font-bold text-teal">WELCOME BACK</div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your alumni community is just a step away.
            </p>
          </div>
          <form className="space-y-5" onSubmit={submit}>
            <Field
              label="Email address"
              error={f.formState.errors.email?.message}
            >
              <input
                className="field"
                type="email"
                placeholder="you@example.com"
                {...f.register("email")}
              />
            </Field>
            <Field
              label="Password"
              error={f.formState.errors.password?.message}
            >
              <input
                className="field"
                type="password"
                placeholder="Enter your password"
                {...f.register("password")}
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-bold text-teal"
                onClick={() =>
                  toast.info(
                    "Please contact your administrator to reset your password.",
                  )
                }
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            <button disabled={busy} className="btn btn-primary w-full !py-3">
              {busy ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : null}
              Sign in <ChevronRight size={17} />
            </button>
          </form>
          <div className="mt-8 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            <b className="text-slate-700">Need access?</b>
            <br />
            Contact your alumni office to activate your account.
          </div>
          <div className="mt-7 text-center text-sm">
            <a
              className="font-bold text-cyan-300 hover:text-pink-300"
              href="/gallery"
            >
              Explore the community gallery
            </a>
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">
            Secure access · Privacy protected
          </div>
        </div>
      </section>
    </div>
  );
}
export function Unauthorized() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="text-center">
        <div className="text-6xl font-extrabold text-teal">403</div>
        <h1 className="mt-3 text-2xl font-bold">This area is restricted</h1>
        <p className="mt-2 text-slate-500">
          Your account doesn’t have access to this page.
        </p>
        <Link className="btn btn-primary mt-6" to="/login">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="text-center">
        <div className="text-6xl font-extrabold text-teal">404</div>
        <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-slate-500">
          The page you’re looking for may have moved.
        </p>
        <Link className="btn btn-primary mt-6" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
