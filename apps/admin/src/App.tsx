// The Admin Portal: log in, check the account is a team account, then author Destinations.

import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type FormEvent } from 'react';
import { DestinationEditor } from './components/DestinationEditor';
import { errorMessage, Field, Notice } from './components/Field';
import { NewDestinationForm } from './components/DestinationDetails';
import { checkMembership, configError, listDestinations, supabase, type Membership } from './lib/api';
import type { DestinationRow } from './lib/types';

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (configError) return <Centered title="Admin Portal"><Notice tone="caution">{configError}</Notice></Centered>;
  if (session === undefined) return <Centered title="Admin Portal"><p className="muted">Loading…</p></Centered>;
  if (!session) return <Login />;
  return <TeamGate session={session} />;
}

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="center">
      <div className="card">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}

/** Email and password only. There is no sign-up: team accounts are created by the team. */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (failure) setError(failure.message === 'Invalid login credentials' ? 'Wrong email or password.' : failure.message);
  }

  return (
    <Centered title="Tahak Admin Portal">
      <p className="muted">For the Tahak team. Log in with your team account to author Destination Packs.</p>
      <form onSubmit={submit}>
        <Field label="Email">
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error ? <Notice tone="caution">{error}</Notice> : null}
        <button type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </Centered>
  );
}

/** Only team accounts get past here. The database enforces the same rule on every write (RLS). */
function TeamGate({ session }: { session: Session }) {
  const [membership, setMembership] = useState<Membership | 'checking' | { error: string }>('checking');

  useEffect(() => {
    checkMembership().then(setMembership, (error: unknown) => setMembership({ error: errorMessage(error) }));
  }, [session.user.id]);

  const signOut = () => void supabase.auth.signOut();

  if (membership === 'checking') return <Centered title="Admin Portal"><p className="muted">Checking your account…</p></Centered>;
  if (membership === 'member') return <Portal email={session.user.email ?? ''} onSignOut={signOut} />;
  return (
    <Centered title={membership === 'not-member' ? 'Not a team account' : 'Admin Portal'}>
      {membership === 'not-member' ? (
        <p>
          {session.user.email} is not a team account, so it cannot change Destination Packs. Ask the team to add you, or
          log in with your team account.
        </p>
      ) : membership === 'migration-missing' ? (
        <Notice tone="caution">
          The Admin Portal's database migration is not applied yet (supabase/migrations/…_admin_portal_team_writes.sql).
        </Notice>
      ) : (
        <Notice tone="caution">Could not check your account: {membership.error}</Notice>
      )}
      <button className="secondary" onClick={signOut}>Log out</button>
    </Centered>
  );
}

function Portal({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [destinations, setDestinations] = useState<DestinationRow[] | null>(null);
  const [selected, setSelected] = useState<string | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh(select?: string) {
    try {
      setDestinations(await listDestinations());
      if (select) setSelected(select);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  useEffect(() => void refresh(), []);

  return (
    <>
      <header className="topbar">
        <h1>Tahak Admin Portal</h1>
        <span className="who">{email}</span>
        <button onClick={onSignOut}>Log out</button>
      </header>
      <div className="layout">
        <nav className="sidebar">
          <h2>Destinations</h2>
          {error ? <Notice tone="caution">{error}</Notice> : null}
          {destinations === null ? <p className="muted">Loading…</p> : null}
          <ul>
            {destinations?.map((destination) => (
              <li key={destination.id}>
                <button
                  className={selected === destination.id ? 'selected' : ''}
                  onClick={() => setSelected(destination.id)}
                >
                  {destination.name}
                  <br />
                  <span className="muted small">
                    {destination.region} · v{destination.pack_version}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button className="secondary" onClick={() => setSelected('new')}>New Destination</button>
        </nav>
        <main className="main">
          {selected === 'new' ? (
            <NewDestinationForm
              takenIds={new Set(destinations?.map((destination) => destination.id))}
              onCreated={(id) => void refresh(id)}
            />
          ) : selected ? (
            <DestinationEditor key={selected} destinationId={selected} onChanged={() => void refresh()} />
          ) : (
            <p className="muted">Pick a Destination to edit its Trails, Waypoints and reference passages, or add a new one.</p>
          )}
        </main>
      </div>
    </>
  );
}
