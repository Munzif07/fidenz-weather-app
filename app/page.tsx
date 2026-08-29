import { auth0 } from "@/lib/auth0";
import { Dashboard } from "@/components/Dashboard";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <p className="font-data text-xs tracking-widest text-comfort-high uppercase">
            Weather Analytics
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-halo sm:text-4xl">
            Comfort Index
          </h1>
          <p className="mt-3 max-w-sm text-sm text-mist">
            Sign in to view live comfort rankings across cities.
          </p>
        </div>
        <a
          href="/auth/login"
          className="font-data rounded-full bg-comfort-high px-6 py-2.5 text-sm font-semibold text-abyss transition hover:opacity-90"
        >
          Log in
        </a>
      </main>
    );
  }

  return <Dashboard userEmail={session.user.email} />;
}
