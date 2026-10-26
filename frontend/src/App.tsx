import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Gamepad2, LayoutDashboard, LogOut, Mail, Menu, RefreshCw, Shield, ShieldCheck, Trophy, UserRound, Users } from 'lucide-react';

const events = [
  { type: 'CLAN EVENT', title: 'Ruby Scrim Night', date: 'COMING SOON', detail: 'Team practice · Custom rooms' },
  { type: 'COMMUNITY', title: 'Recruitment Open', date: 'NOW OPEN', detail: 'Meet the clan · Apply to join' },
  { type: 'COMPETITIVE', title: 'Weekly Showdown', date: 'UPCOMING', detail: 'Competitive matches · Teamwork' },
];

type AppUser = {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

type ProfileRow = {
  id: string;
  display_name: string;
  ign: string | null;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

function asAppUser(user: { id: string; email?: string; created_at?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown> } | null | undefined): AppUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    email_confirmed_at: user.email_confirmed_at,
    user_metadata: user.user_metadata
  };
}

function useAuthUser() {
  const [user,setUser]=useState<AppUser|null>(null);
  useEffect(()=>{
    let active=true;
    let unsubscribe:(()=>void)|undefined;
    (async()=>{
      try{
        if(!import.meta.env.VITE_SUPABASE_URL||!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) return;
        const {supabase}=await import('./lib/supabase');
        if(!active) return;
        const {data}=supabase.auth.onAuthStateChange((_event,session)=>{
          if(active) setUser(asAppUser(session?.user));
        });
        unsubscribe=()=>data.subscription.unsubscribe();
        const {data:{session}}=await supabase.auth.getSession();
        if(active) setUser(asAppUser(session?.user));
      }catch{
        if(active) setUser(null);
      }
    })();
    return ()=>{active=false;unsubscribe?.()};
  },[]);
  return user;
}

function displayNameFor(user: AppUser | null) {
  const metadataName = String(user?.user_metadata?.display_name ?? '').trim();
  return metadataName || user?.email?.split('@')[0] || 'Member';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
function Brand(){return <Link to="/" className="brand" aria-label="Ruby Essentials home"><img className="brand-logo" src="/transparent%20logo.png" alt="" width="66" height="66"/><span className="brand-name"><b>RUBY</b><strong>ESSENTIALS</strong></span></Link>}
function Header(){
  const [open,setOpen]=useState(false);
  const [signingOut,setSigningOut]=useState(false);
  const [logoutError,setLogoutError]=useState('');
  const user=useAuthUser();
  const navigate=useNavigate();
  useEffect(()=>{
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    window.addEventListener('keydown',closeOnEscape);
    return()=>window.removeEventListener('keydown',closeOnEscape)
  },[]);
  const closeMenu=()=>setOpen(false);
  const handleSignOut=async()=>{
    setSigningOut(true);setLogoutError('');
    try{
      const {supabase}=await import('./lib/supabase');
      const {error}=await supabase.auth.signOut();
      if(error) throw error;
      setOpen(false);
      navigate('/',{replace:true});
    }catch{
      setLogoutError('Could not sign out. Please try again.');
    }finally{setSigningOut(false)}
  };
  const accountName=displayNameFor(user);
  const initials=accountName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'RE';
  return <header className="header">
    <Brand/>
    <button className="mobile-toggle" type="button" onClick={()=>setOpen(value=>!value)} aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="primary-navigation"><Menu aria-hidden="true"/></button>
    <nav id="primary-navigation" className={open?'nav nav-open':'nav'} aria-label="Main navigation">
      <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
      <a href="/#about" onClick={closeMenu}>About</a>
      <NavLink to="/members" onClick={closeMenu}>Roster</NavLink>
      <NavLink to="/events" onClick={closeMenu}>News</NavLink>
      <a href="/#gallery" onClick={closeMenu}>Gallery</a>
      <a href="/#contact" onClick={closeMenu}>Contact</a>
      {user&&<NavLink className="nav-dashboard" to="/dashboard" onClick={closeMenu}><LayoutDashboard size={14}/> Dashboard</NavLink>}
    </nav>
    <div className="header-actions">
      {user ? <>
        <Link to="/dashboard" className="header-account-chip" title={user.email||'Member account'} onClick={closeMenu}>
          <span className="header-account-avatar">{initials}</span>
          <span className="header-account-copy"><strong>{accountName}</strong><small>MEMBER ACCOUNT</small></span>
        </Link>
        <button className="header-signout" type="button" onClick={handleSignOut} disabled={signingOut} aria-label="Sign out" title="Sign out">
          <LogOut size={15}/><span>{signingOut?'Signing out':'Sign out'}</span>
        </button>
      </> : <Link className="login-link" to="/login" onClick={closeMenu}>⇥ &nbsp; Login / Register</Link>}
    </div>
    {logoutError&&<span className="header-logout-error" role="status">{logoutError}</span>}
  </header>
}
function Footer(){return <footer className="footer" id="contact"><Brand/><p>We The Confidence</p><small>© 2026 RUBY ESSENTIALS · CALL OF DUTY MOBILE ESPORTS</small></footer>}
function Home(){
  const user=useAuthUser();
  const primaryPath=user?'/dashboard':'/join';
  const primaryLabel=user?'OPEN DASHBOARD':'JOIN OUR CLAN';
  return <><main className="landing-home">
    <section className="landing-hero">
      <div className="landing-copy">
        <p className="landing-kicker">CALL OF DUTY MOBILE ESPORTS CLAN</p>
        <h1><span>RUBY</span><strong>ESSENTIALS</strong></h1>
        <p className="landing-tagline">ESPORTS <span aria-hidden="true">•</span> APPAREL <span aria-hidden="true">•</span> COMMUNITY</p>
        <div className="landing-actions">
          <Link className="landing-primary" to={primaryPath}><img src="/transparent%20logo.png" alt="" width="42" height="42" loading="lazy" decoding="async"/> {primaryLabel} <ArrowUpRight size={17}/></Link>
          <a className="landing-secondary" href="#about"><Shield size={15}/> LEARN MORE</a>
        </div>
      </div>
      <div className="landing-crest"><div className="crest-glow"></div><img src="/transparent%20logo.png" alt="Ruby Essentials logo" width="420" height="450" fetchPriority="high" decoding="async"/></div>
    </section>
    <section className="mission-grid" id="about">
      <article className="mission-card"><h2>OUR <em>MISSION</em></h2><p>To build a competitive and supportive community in<br className="desktop-only"/> Call of Duty Mobile.</p></article>
      <article className="mission-card"><h2>OUR <em>VISION</em></h2><p>To become one of the most respected and recognized<br className="desktop-only"/> CODM clans in the region.</p></article>
      <article className="mission-card"><h2>OUR <em>VALUES</em></h2><ul><li>Teamwork</li><li>Discipline</li><li>Respect</li><li>Growth</li></ul></article>
      <article className="mission-card"><h2>OUR <em>COMMUNITY</em></h2><p>Real players. Real bonds.<br/>One goal.</p></article>
    </section>
    <section className="latest-section" id="latest">
      <div className="latest-intro"><p className="landing-kicker">LATEST UPDATES</p><h2>STAY <em>CONNECTED</em></h2><p>Get the latest news, events, and announcements from Ruby Essentials.</p></div>
      <div className="news-cards">
        <article className="news-card"><Link className="news-card-link" to="/events" aria-label="Read Welcome to Our New Website update"><div className="news-art news-art-crest"><img src="/transparent%20logo.png" alt="Ruby Essentials" width="94" height="94" loading="lazy" decoding="async"/></div><div className="news-copy"><span>ANNOUNCEMENT</span><h3>Welcome to Our New Website</h3><p>We're excited to officially launch our clan website. Stay tuned for updates, events, and more!</p><time>CLAN UPDATE</time></div></Link></article>
        <article className="news-card"><Link className="news-card-link" to="/events" aria-label="View CODM Scrim Schedule"><div className="news-art news-art-soldier"><div className="soldier-visor"></div><div className="soldier-body"></div></div><div className="news-copy"><span>EVENT</span><h3>CODM Scrim Schedule</h3><p>Check out our upcoming scrim schedule and be ready for the action!</p><time>SCHEDULE TBA</time></div></Link></article>
      </div>
    </section>
    <section className="gallery-strip" id="gallery"><p className="landing-kicker">ONE CLAN. ONE FAMILY.</p><h2>READY TO REPRESENT <em>RUBY?</em></h2><Link className="landing-primary" to={primaryPath}>{primaryLabel} <ArrowUpRight size={17}/></Link></section>
  </main></>
}
function Members(){const slots=[1,2,3,4,5];return <main className="page section roster-page"><p className="eyebrow"><span className="accent">01 / </span>THE ROSTER</p><h1 className="page-title">MEET THE <span className="accent">CLAN.</span></h1><p className="muted page-intro">Meet the players behind the tag. Official names and roles will appear here as the lineup is confirmed.</p><div className="roster-panel-heading"><span className="roster-status"><span></span> ROSTER REVEAL IN PROGRESS</span><span className="roster-count">05 PLAYER SLOTS</span></div><section className="roster-panel-grid" aria-label="Roster player panels">{slots.map(slot=><article className="roster-player-panel" key={slot}><div className="roster-panel-art"><span className="roster-panel-number">0{slot}</span><div className="roster-panel-sheen"></div><img src="/transparent%20logo.png" alt="Ruby Essentials emblem" loading="lazy" decoding="async"/><span className="roster-panel-tag">RUBY ESSENTIALS</span></div><div className="roster-panel-info"><p className="eyebrow">PLAYER SLOT 0{slot}</p><h2>[IGN]</h2><div className="roster-panel-divider"></div><div className="roster-panel-meta"><span>IN-GAME NAME</span><strong>COMING SOON</strong></div><div className="roster-panel-meta"><span>ROLE</span><strong>TO BE ANNOUNCED</strong></div></div></article>)}</section><div className="roster-panel-footer"><p>Real players. Real bonds. One goal.</p><Link className="landing-primary roster-join" to="/join">JOIN OUR CLAN <ArrowUpRight size={16}/></Link></div></main>}
function AccountDashboard(){
  const navigate=useNavigate();
  const [loading,setLoading]=useState(true);
  const [refreshCount,setRefreshCount]=useState(0);
  const [account,setAccount]=useState<AppUser|null>(null);
  const [profile,setProfile]=useState<ProfileRow|null>(null);
  const [application,setApplication]=useState<ApplicationRow|null>(null);
  const [loadError,setLoadError]=useState('');
  const [refreshing,setRefreshing]=useState(false);

  useEffect(()=>{
    let active=true;
    let unsubscribe:(()=>void)|undefined;
    const load=async()=>{
      try{
        if(!import.meta.env.VITE_SUPABASE_URL||!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY){
          if(active){setLoadError('Account services are not configured.');setLoading(false)}
          return;
        }
        const {supabase}=await import('./lib/supabase');
        const {data:listener}=supabase.auth.onAuthStateChange((event)=>{
          if(event==='SIGNED_OUT'&&active) navigate('/login',{replace:true});
        });
        unsubscribe=()=>listener.subscription.unsubscribe();
        const {data:{session},error:sessionError}=await supabase.auth.getSession();
        if(!active)return;
        if(sessionError)throw sessionError;
        if(!session){
          navigate('/login',{replace:true});
          return;
        }
        const signedInUser=asAppUser(session.user);
        setAccount(signedInUser);
        const [profileResult,applicationResult]=await Promise.all([
          supabase.from('profiles').select('id,display_name,ign,created_at').eq('id',session.user.id).maybeSingle(),
          supabase.from('join_applications').select('id,status,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(1)
        ]);
        if(!active)return;
        if(profileResult.error)throw profileResult.error;
        if(applicationResult.error)throw applicationResult.error;
        setProfile(profileResult.data as ProfileRow|null);
        setApplication((applicationResult.data?.[0] as ApplicationRow|undefined)??null);
        setLoadError('');
      }catch(error){
        if(active){
          const message=error instanceof Error?error.message:'Unable to load your account details.';
          setLoadError(message);
        }
      }finally{
        if(active){setLoading(false);setRefreshing(false)}
      }
    };
    setLoading(true);
    setRefreshing(refreshCount>0);
    void load();
    return ()=>{active=false;unsubscribe?.()};
  },[navigate,refreshCount]);

  const userName=profile?.display_name||displayNameFor(account);
  const ign=profile?.ign||String(account?.user_metadata?.ign||'').trim();
  const requestStatus=application?.status??'none';
  const statusLabel=requestStatus==='pending'?'Pending review':requestStatus==='approved'?'Approved':requestStatus==='rejected'?'Not approved':'No request yet';
  const statusDescription=requestStatus==='pending'
    ?'Your request has been received and is waiting for the clan team to review it.'
    :requestStatus==='approved'
      ?'Your membership request has been approved. Welcome to the clan.'
      :requestStatus==='rejected'
        ?'Your previous request was not approved. Contact the clan team for guidance.'
        :'No membership request is connected to this account yet.';
  const createdAt=profile?.created_at||account?.created_at;

  if(loading){
    return <main className="account-page page section"><div className="account-loading"><span className="account-loading-mark"><RefreshCw size={22}/></span><p className="eyebrow">RUBY ESSENTIALS / MEMBER CENTER</p><h1>PREPARING YOUR <span className="accent">ACCOUNT.</span></h1><p className="muted">Securely loading your profile and membership status…</p></div></main>;
  }

  return <main className="account-page page section">
    <section className="account-hero">
      <div className="account-hero-copy">
        <p className="eyebrow"><span className="accent">MEMBER CENTER / </span>YOUR ACCOUNT</p>
        <h1 className="page-title">YOUR <span className="accent">ACCOUNT.</span></h1>
        <p className="muted account-intro">Your Ruby Essentials account, profile details, and membership progress—all in one place.</p>
        <div className="account-hero-actions">
          <Link className="landing-primary" to="/members">VIEW CLAN ROSTER <ArrowRight size={16}/></Link>
          <button className="account-refresh" type="button" onClick={()=>setRefreshCount(count=>count+1)} disabled={refreshing}><RefreshCw size={14}/> {refreshing?'Refreshing…':'Refresh status'}</button>
        </div>
      </div>
      <div className="account-hero-emblem">
        <div className="account-emblem-ring"></div>
        <img src="/transparent%20logo.png" alt="Ruby Essentials emblem" width="180" height="180"/>
        <span><ShieldCheck size={13}/> ACCOUNT SIGNED IN</span>
      </div>
    </section>

    {loadError&&<p className="account-error" role="alert">We couldn't load all of your account data. {loadError}</p>}

    <section className="account-summary-grid" aria-label="Account overview">
      <article className="account-summary-card">
        <span className="account-summary-icon"><Mail size={18}/></span>
        <div><p className="eyebrow">EMAIL ADDRESS</p><strong className="account-summary-value">{account?.email||'Email unavailable'}</strong><span className="account-summary-note"><CheckCircle2 size={13}/> Signed in with Supabase</span></div>
      </article>
      <article className="account-summary-card">
        <span className="account-summary-icon"><UserRound size={18}/></span>
        <div><p className="eyebrow">IN-GAME NAME</p><strong className="account-summary-value">{ign||'Not added yet'}</strong><span className="account-summary-note">{ign?'From your Ruby profile':'Add your IGN when requesting to join'}</span></div>
      </article>
      <article className="account-summary-card">
        <span className="account-summary-icon"><Clock3 size={18}/></span>
        <div><p className="eyebrow">MEMBERSHIP REQUEST</p><strong className="account-summary-value">{statusLabel}</strong><span className={'account-status-dot status-'+requestStatus}>{requestStatus==='approved'?'Approved':requestStatus==='rejected'?'Needs attention':requestStatus==='pending'?'Awaiting review':'No request yet'}</span></div>
      </article>
    </section>

    <section className="account-content-grid">
      <article className="account-panel">
        <div className="account-panel-heading"><div><p className="eyebrow">ACCOUNT DETAILS</p><h2>YOUR <span className="accent">PROFILE.</span></h2></div><span className="account-panel-icon"><UserRound size={19}/></span></div>
        <div className="account-profile-banner"><span className="account-profile-avatar">{userName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'RE'}</span><div><strong>{userName}</strong><small>{account?.email||'Signed-in Ruby member'}</small></div></div>
        <dl className="account-details-list">
          <div><dt>DISPLAY NAME</dt><dd>{userName}</dd></div>
          <div><dt>IN-GAME NAME</dt><dd>{ign||'Not provided'}</dd></div>
          <div><dt>ACCOUNT CREATED</dt><dd>{formatDate(createdAt)}</dd></div>
          <div><dt>PROFILE RECORD</dt><dd>{profile?'Saved in database':'Waiting for profile record'}</dd></div>
        </dl>
      </article>

      <article className="account-panel membership-panel">
        <div className="account-panel-heading"><div><p className="eyebrow">CLAN APPLICATION</p><h2>YOUR <span className="accent">STATUS.</span></h2></div><span className={'account-status-pill status-'+requestStatus}>{requestStatus==='pending'?'UNDER REVIEW':requestStatus==='approved'?'APPROVED':requestStatus==='rejected'?'NOT APPROVED':'NOT SUBMITTED'}</span></div>
        <div className="membership-status-visual"><span className={'membership-status-symbol status-'+requestStatus}>{requestStatus==='approved'?<CheckCircle2 size={24}/>:requestStatus==='pending'?<Clock3 size={24}/>:<Shield size={24}/>}</span><div><strong>{statusLabel}</strong><p>{statusDescription}</p></div></div>
        {application&&<p className="account-request-date">REQUEST SUBMITTED <strong>{formatDate(application.created_at)}</strong></p>}
        {!application&&<Link to="/join" className="account-inline-action">REQUEST TO JOIN <ArrowRight size={15}/></Link>}
        <div className="account-panel-divider"></div>
        <p className="account-small-note">Your account credentials stay private. Membership status is read from your own account records.</p>
      </article>
    </section>

    <section className="account-quick-links">
      <div><p className="eyebrow">KEEP EXPLORING</p><h2>STAY IN THE <span className="accent">LOOP.</span></h2></div>
      <Link to="/events" className="account-quick-link"><span className="account-quick-icon"><Trophy size={18}/></span><span><strong>Clan news & events</strong><small>See the latest activities and updates.</small></span><ArrowUpRight size={17}/></Link>
      <Link to="/members" className="account-quick-link"><span className="account-quick-icon"><Users size={18}/></span><span><strong>Meet the roster</strong><small>Explore the Ruby Essentials lineup.</small></span><ArrowUpRight size={17}/></Link>
    </section>
  </main>;
}

function Events(){return <main className="page section"><p className="eyebrow"><span className="accent">02 / </span>CLAN ACTIVITIES</p><h1 className="page-title">EVENTS & <span className="accent">UPDATES.</span></h1><p className="muted page-intro">Clan scrims, recruitment updates, and community activities in one place.</p><div className="event-grid">{events.map((e,i)=><article className="event-card" key={e.title}><div className="card-top"><span className="game-icon">{i===0?<Gamepad2 size={20}/>:i===1?<Users size={20}/>:<Trophy size={20}/>}</span><span className={'status '+(i===1?'live':'')}>{e.date}</span></div><p className="eyebrow">{e.type}</p><h3>{e.title}</h3><p className="muted">{e.detail}</p><Link className="card-action" to={i===1?"/join":"/#contact"}>{i===1?"Apply to join":"Get involved"} <ArrowUpRight size={15}/></Link></article>)}</div></main>}
function AuthPage({mode}:{mode:'login'|'join'|'forgot'|'reset'}){
  const navigate=useNavigate();
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [checkingSession,setCheckingSession]=useState(mode==='login');
  const manualAuthInProgress=useRef(false);
  const configured=Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const authRedirectUrl='https://ruby-essentials.vercel.app';

  // On the login route, resume a session created by the email-confirmation link.
  // Do not run this on password-reset pages, where recovery sessions must remain available.
  useEffect(()=>{
    if(mode!=='login') return;
    let active=true;
    let redirected=false;
    let unsubscribe:(()=>void)|undefined;

    const redirectSignedInUser=()=>{
      if(!active||redirected) return;
      redirected=true;
      navigate('/dashboard',{replace:true});
    };

    (async()=>{
      try{
        if(!configured){
          if(active) setCheckingSession(false);
          return;
        }
        const {supabase}=await import('./lib/supabase');
        if(!active) return;

        const {data}=supabase.auth.onAuthStateChange((event,session)=>{
          if(session&&!manualAuthInProgress.current&&(event==='INITIAL_SESSION'||event==='SIGNED_IN')){
            redirectSignedInUser();
          }
        });
        unsubscribe=()=>data.subscription.unsubscribe();

        const {data:{session}}=await supabase.auth.getSession();
        if(!active) return;
        if(session&&!manualAuthInProgress.current){
          redirectSignedInUser();
          return;
        }
        setCheckingSession(false);
      }catch{
        if(active) setCheckingSession(false);
      }
    })();

    return ()=>{
      active=false;
      unsubscribe?.();
    };
  },[mode,navigate,configured]);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    manualAuthInProgress.current=true;
    const formElement=e.currentTarget;
    const form=new FormData(formElement);
    setMessage('');setBusy(true);
    try{
      if(!configured) throw new Error('Account services are not configured yet. Please try again later.');
      const { supabase } = await import('./lib/supabase');
      const email=String(form.get('email')||'').trim();
      if(mode==='forgot'){
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl+'/reset-password'});
        if(error) throw error;
        setMessage('If an account exists for that email, a password reset link will be sent. Check your inbox and spam folder.');return;
      }
      const password=String(form.get('password')||'');
      if(mode==='reset'){
        const confirmation=String(form.get('confirmPassword')||'');
        if(password.length<8) throw new Error('Your new password must be at least 8 characters.');
        if(password!==confirmation) throw new Error('The passwords do not match.');
        const {error}=await supabase.auth.updateUser({password});
        if(error) throw error;
        await supabase.auth.signOut();
        setMessage('Your password has been updated. You can now log in with your new password.');
        navigate('/login',{replace:true});
        return;
      }
      if(mode==='login'){
        const {data,error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        const user=data.user;
        const displayName=String(user.user_metadata?.display_name||'').trim();
        const ign=String(user.user_metadata?.ign||'').trim();
        if(displayName){
          const {error:profileError}=await supabase.from('profiles').upsert({id:user.id,display_name:displayName,ign:ign||null},{onConflict:'id'});
          if(profileError) throw profileError;
          const {data:applications,error:lookupError}=await supabase.from('join_applications').select('id').eq('user_id',user.id).limit(1);
          if(lookupError) throw lookupError;
          if(!applications?.length){
            const {error:applicationError}=await supabase.from('join_applications').insert({user_id:user.id,display_name:displayName,ign:ign||null});
            if(applicationError) throw applicationError;
          }
        }
        setMessage('You are signed in successfully.');
        navigate('/dashboard',{replace:true});
        return;
      }
      const confirmation=String(form.get('confirmPassword')||'');
      if(password.length<8) throw new Error('Your password must be at least 8 characters.');
      if(password!==confirmation) throw new Error('The passwords do not match.');
      const displayName=String(form.get('displayName')||'').trim();
      const ign=String(form.get('ign')||'').trim();
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:authRedirectUrl+'/login',data:{display_name:displayName,ign}}});
      if(error) throw error;
      if(data.session && data.user){
        const {error:profileError}=await supabase.from('profiles').upsert({id:data.user.id,display_name:displayName,ign:ign||null},{onConflict:'id'});
        if(profileError) throw profileError;
        const {error:applicationError}=await supabase.from('join_applications').insert({user_id:data.user.id,display_name:displayName,ign:ign||null});
        if(applicationError) throw applicationError;
        setMessage('Your account was created and your join request submitted.');
        navigate('/dashboard',{replace:true});
      }else{
        setMessage('Account created. Check your email and confirm your address. Your profile and membership request will be saved automatically after confirmation; then log in.');
      }
    }catch(err){
      const error=err as {message?:string};
      setMessage(error.message||'Something went wrong. Please try again.');
    }finally{setBusy(false);manualAuthInProgress.current=false}
  }
  if(mode==='login'&&checkingSession){
    return <main className="auth-wrap"><div className="auth-card"><div className="auth-symbol"><img className="auth-logo" src="/transparent%20logo.png" alt="Ruby Essentials logo"/></div><p className="eyebrow">RUBY ESSENTIALS ACCOUNT</p><h1>CHECKING YOUR SESSION.</h1><p className="muted" role="status">Checking whether you're already signed in…</p></div></main>;
  }
  return <main className="auth-wrap"><div className="auth-card"><div className="auth-symbol"><img className="auth-logo" src="/transparent%20logo.png" alt="Ruby Essentials logo"/></div><p className="eyebrow">RUBY ESSENTIALS ACCOUNT</p><h1>{mode==='login'?'WELCOME BACK.':mode==='join'?'JOIN THE CLAN.':mode==='reset'?'CHOOSE A NEW PASSWORD.':'RESET ACCESS.'}</h1><p className="muted">{mode==='login'?'Sign in to your Ruby Essentials account.':mode==='join'?'Create your account and submit a membership request.':mode==='reset'?'Choose a new password for your account.':'Enter your account email to receive a password reset link.'}</p><form onSubmit={submit}>{mode==='join'&&<label>Display name<input name="displayName" required minLength={2} maxLength={60} placeholder="Your name or clan alias"/></label>}{mode!=='reset'&&<label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>}{mode!=='forgot'&&<label>{mode==='reset'?'New password':'Password'}<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="At least 8 characters"/></label>}{(mode==='join'||mode==='reset')&&<label>Confirm password<input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Enter password again"/></label>}{mode==='join'&&<label>In-game name<input name="ign" maxLength={40} placeholder="Your IGN"/></label>}<button className="btn auth-submit" disabled={busy||!configured}>{busy?'Please wait…':mode==='login'?'Log in':mode==='join'?'Create account & request to join':mode==='reset'?'Update password':'Send reset link'} <ArrowUpRight size={17}/></button></form>{message&&<p className="form-message" role="status">{message}</p>}{!configured&&<p className="hint">Account services are not configured yet. Please try again later.</p>}<div className="auth-bottom">{mode==='login'?<><Link to="/forgot-password">Forgot password?</Link><span>New to Ruby? <Link to="/join">Request to join</Link></span></>:mode==='join'?<span>Already have an account? <Link to="/login">Log in</Link></span>:mode==='reset'?<span>Remembered it? <Link to="/login">Back to login</Link></span>:<span>Remembered it? <Link to="/login">Back to login</Link></span>}</div></div></main>
}
function Admin(){return <main className="page section"><p className="eyebrow"><span className="accent">ADMIN / </span>CONTROL ROOM</p><h1 className="page-title">CLAN <span className="accent">CENTER.</span></h1><p className="muted page-intro">Admin dashboard preview. Secure roles and backend access must be configured before live member data can be managed.</p><div className="admin-grid"><Link to="/members" className="admin-action"><span className="muted">MEMBERS</span><strong>View roster</strong><p className="muted">Browse member profiles and clan roles.</p><span className="card-action">Open roster <ArrowUpRight size={15}/></span></Link><Link to="/events" className="admin-action"><span className="muted">EVENTS</span><strong>View updates</strong><p className="muted">Browse scrims, announcements, and activities.</p><span className="card-action">Open events <ArrowUpRight size={15}/></span></Link><Link to="/join" className="admin-action"><span className="muted">APPLICATIONS</span><strong>Join requests</strong><p className="muted">Open the membership request form.</p><span className="card-action">View join form <ArrowUpRight size={15}/></span></Link></div><p className="hint">This is a visual prototype only. Add authenticated, role-protected backend routes before using it for real administration.</p></main>}
export default function App(){return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/dashboard" element={<AccountDashboard/>}/><Route path="/members" element={<Members/>}/><Route path="/events" element={<Events/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/join" element={<AuthPage mode="join"/>}/><Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/><Route path="/reset-password" element={<AuthPage mode="reset"/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="page section"><h1 className="page-title">PAGE NOT FOUND<span className="accent">.</span></h1><Link to="/" className="text-link">Return home <ArrowUpRight size={17}/></Link></main>}/></Routes><Footer/></>}
