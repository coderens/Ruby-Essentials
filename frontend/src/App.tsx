import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ArrowUpRight, Camera, CheckCircle2, Clock3, Gamepad2, LayoutDashboard, LogOut, Mail, Menu, RefreshCw, Shield, ShieldCheck, Trophy, UserRound, Users } from 'lucide-react';

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
  app_metadata?: Record<string, unknown>;
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
  user_id?: string;
  display_name?: string;
  ign?: string | null;
  email?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

function asAppUser(user: { id: string; email?: string; created_at?: string; email_confirmed_at?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined): AppUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    email_confirmed_at: user.email_confirmed_at,
    app_metadata: user.app_metadata,
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
      <NavLink to="/members" onClick={closeMenu}>Ruby Official</NavLink>
      <NavLink to="/events" onClick={closeMenu}>News</NavLink>
      <NavLink to="/gallery" onClick={()=>{closeMenu();window.scrollTo(0,0)}}>Gallery</NavLink>
      {user&&<NavLink className="nav-dashboard" to="/dashboard" onClick={closeMenu}><LayoutDashboard size={14}/> Dashboard</NavLink>}
      {user?.app_metadata?.role==='admin'&&<NavLink className="nav-dashboard" to="/admin" onClick={closeMenu}><ShieldCheck size={14}/> Admin</NavLink>}
    </nav>
    <div className="header-actions">
      {user ? <>
        <Link to="/dashboard" className="header-account-chip" title={user.email||'Member account'} onClick={closeMenu}>
          <span className="header-account-avatar">{initials}</span>
          <span className="header-account-copy"><strong>{accountName}</strong><small>{user.app_metadata?.role==='admin'?'ADMIN ACCOUNT':'MEMBER ACCOUNT'}</small></span>
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
        <h1><span>We The</span><strong>Confidence</strong></h1>
        <p className="landing-tagline">Artists. Contenders. Community.</p>
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
    <GallerySection />
  </main></>
}
function GallerySection(){
  return (
    <section className="gallery-section" id="gallery" aria-labelledby="gallery-heading">
      <div className="gallery-section-heading">
        <div className="gallery-section-heading-copy">
          <h2 id="gallery-heading">RUBY <em>GALLERY.</em></h2>
          <p>Memories, achievements, and moments from the clan.</p>
        </div>
      </div>
      <div className="gallery-collection-grid">
        <article className="gallery-collection-card">
          <div className="gallery-collection-visual gallery-visual-memories">
            <span className="gallery-visual-icon"><Camera size={25}/></span>
            <span className="gallery-visual-index">01 / MEMORIES</span>
            <span className="gallery-visual-placeholder">CLAN MOMENTS</span>
          </div>
          <div className="gallery-collection-copy">
            <p className="eyebrow">THE PEOPLE BEHIND THE CLAN</p>
            <h3>Moments Together</h3>
            <p>Scrims, celebrations, community moments, and memories made together.</p>
            <span className="gallery-coming-soon">PHOTOS WILL BE ADDED HERE</span>
          </div>
        </article>
        <article className="gallery-collection-card">
          <div className="gallery-collection-visual gallery-visual-achievements">
            <span className="gallery-visual-icon"><Trophy size={25}/></span>
            <span className="gallery-visual-index">02 / ACHIEVEMENTS</span>
            <span className="gallery-visual-placeholder">MILESTONES</span>
          </div>
          <div className="gallery-collection-copy">
            <p className="eyebrow">PROGRESS WORTH REMEMBERING</p>
            <h3>Milestones &amp; Achievements</h3>
            <p>Tournament highlights, placements, and clan milestones—added as they are recorded.</p>
            <span className="gallery-coming-soon">ACHIEVEMENTS WILL BE ADDED HERE</span>
          </div>
        </article>
        <article className="gallery-collection-card">
          <div className="gallery-collection-visual gallery-visual-community">
            <span className="gallery-visual-icon"><Users size={25}/></span>
            <span className="gallery-visual-index">03 / COMMUNITY</span>
            <span className="gallery-visual-placeholder">ONE RUBY FAMILY</span>
          </div>
          <div className="gallery-collection-copy">
            <p className="eyebrow">MORE THAN THE GAME</p>
            <h3>Community Highlights</h3>
            <p>Teamwork, friendships, and the moments that make Ruby Essentials a community.</p>
            <span className="gallery-coming-soon">COMMUNITY PHOTOS COMING SOON</span>
          </div>
        </article>
      </div>
      <div className="gallery-section-footer">
        <span>OUR STORY IS STILL BEING WRITTEN.</span>
        <Link to="/events" className="gallery-updates-link">EXPLORE CLAN UPDATES <ArrowUpRight size={15}/></Link>
      </div>
    </section>
  );
}
function GalleryPage(){return <main className="gallery-route-page"><GallerySection/></main>}
function Members(){
  const [memberType,setMemberType]=useState('All');
  const [memberSearch,setMemberSearch]=useState('');
  const members=Array.from({length:12},(_,index)=>({
    id:index+1,
    name:'Member profile pending',
    category:index%3===0?'Streamers':index%3===1?'Members':'Content Creators',
    role:index%3===0?'Streamer profile':index%3===1?'Community member':'Content creator',
  }));
  const query=memberSearch.trim().toLowerCase();
  const filteredMembers=members.filter(member=>
    (memberType==='All'||member.category===memberType)&&
    (!query||[member.name,member.category,member.role,String(member.id)].some(value=>value.toLowerCase().includes(query)))
  );
  return <main className="ruby-directory-page">
    <section className="ruby-directory-intro">
      <div className="ruby-directory-intro-copy">
        <p className="landing-kicker"><span className="accent">RUBY ESSENTIALS</span><span className="ruby-directory-slash"> / </span>COMMUNITY</p>
        <h1>MEMBER <span className="accent">DIRECTORY</span></h1>
        <p>Get to know the people behind Ruby Essentials.</p>
      </div>
    </section>
    <section className="ruby-directory-content" aria-labelledby="ruby-directory-heading">
      <div className="ruby-directory-toolbar">
        <div className="ruby-directory-toolbar-label"><span className="ruby-directory-live-dot"/> BROWSE THE ROSTER</div>
        <div className="ruby-directory-filters" role="group" aria-label="Filter members">
          {['All','Members','Streamers','Content Creators'].map(type=><button type="button" key={type} className={memberType===type?'ruby-directory-filter active':'ruby-directory-filter'} onClick={()=>setMemberType(type)} aria-pressed={memberType===type}>{type}</button>)}
        </div>
        <label className="ruby-directory-search">
          <Search size={17} aria-hidden="true"/>
          <input type="search" value={memberSearch} onChange={event=>setMemberSearch(event.target.value)} placeholder="Search members..." aria-label="Search members by name, type, or role"/>
          {memberSearch&&<button type="button" onClick={()=>setMemberSearch('')} aria-label="Clear search">×</button>}
        </label>
      </div>
      <div className="ruby-directory-results-heading">
        <div><h2 id="ruby-directory-heading">THE <span className="accent">ROSTER</span></h2><p>Players, creators, and community members.</p></div>
        <span>{filteredMembers.length} RESULTS</span>
      </div>
      {filteredMembers.length>0?<div className="ruby-directory-grid">
        {filteredMembers.map(member=><article className="ruby-directory-member" key={member.id}>
          <div className="ruby-directory-member-top">
            <span className="ruby-directory-member-type">{member.category}</span>
          </div>
          <div className="ruby-directory-avatar"><img src="/transparent%20logo.png" alt="" loading="lazy" decoding="async"/></div>
          <div className="ruby-directory-member-copy">
            <h3>{member.name}</h3>
            <p>{member.role} · Details coming soon</p>
          </div>
          <div className="ruby-directory-member-bottom"><span><i/> RUBY ESSENTIALS</span><span className="ruby-directory-member-arrow"><ArrowUpRight size={17} aria-hidden="true"/></span></div>
        </article>)}
      </div>:<div className="directorate-empty-state"><strong>No members found</strong><p>Try a different search or filter.</p><button className="ruby-directory-reset" type="button" onClick={()=>{setMemberSearch('');setMemberType('All')}}>Reset filters</button></div>}
      <div className="ruby-directory-join">
        <div><span>YOUR PLACE COULD BE HERE</span><h2>JOIN THE <em>RUBY FAMILY.</em></h2></div>
        <Link className="landing-primary" to="/join">APPLY TO JOIN <ArrowUpRight size={17}/></Link>
      </div>
    </section>
  </main>
}
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

  const isAdmin=account?.app_metadata?.role==='admin';
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

  return <main className="account-page page section account-dashboard">
    <section className="account-dashboard-header">
      <div className="account-dashboard-heading">
        <p className="eyebrow"><span className="accent">RUBY ESSENTIALS / </span>{isAdmin?'ADMIN DASHBOARD':'MEMBER DASHBOARD'}</p>
        <h1 className="account-dashboard-title">{isAdmin?<>WELCOME BACK, <span className="accent">ADMIN.</span></>:<>WELCOME BACK, <span className="accent">{userName}</span></>}</h1>
        <p className="muted account-intro">{isAdmin?'Manage membership requests and access Ruby Essentials administration tools.':'Your profile, membership request, and clan links—organized in one place.'}</p>
      </div>
      <div className="account-hero-actions">
        <Link className="landing-primary" to={isAdmin?'/admin':'/members'}>{isAdmin?'REVIEW APPLICATIONS':'VIEW CLAN ROSTER'} <ArrowRight size={16}/></Link>
        <button className="account-refresh" type="button" onClick={()=>setRefreshCount(count=>count+1)} disabled={refreshing}><RefreshCw size={14}/> {refreshing?'Refreshing…':'Refresh status'}</button>
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
        <div><p className="eyebrow">MEMBER SINCE</p><strong className="account-summary-value">{formatDate(createdAt)}</strong><span className="account-summary-note">Account creation date</span></div>
      </article>
    </section>

    <section className="account-dashboard-grid">
      <div className="account-dashboard-primary">
        <article className="account-panel membership-panel account-status-panel">
          <div className="account-panel-heading">
            <div><p className="eyebrow">CLAN APPLICATION</p><h2>MEMBERSHIP <span className="accent">STATUS.</span></h2></div>
            <span className={'account-status-pill status-'+requestStatus}>{requestStatus==='pending'?'UNDER REVIEW':requestStatus==='approved'?'APPROVED':requestStatus==='rejected'?'NOT APPROVED':'NOT SUBMITTED'}</span>
          </div>
          <div className="membership-status-visual">
            <span className={'membership-status-symbol status-'+requestStatus}>{requestStatus==='approved'?<CheckCircle2 size={24}/>:requestStatus==='pending'?<Clock3 size={24}/>:<Shield size={24}/>}</span>
            <div><strong>{statusLabel}</strong><p>{statusDescription}</p></div>
          </div>
          {application&&<p className="account-request-date">REQUEST SUBMITTED <strong>{formatDate(application.created_at)}</strong></p>}
          {!application&&<div className="account-application-cta"><div><strong>Ready to join the roster?</strong><p>Send a membership request to the Ruby Essentials team.</p></div><Link to="/join" className="account-inline-action">REQUEST TO JOIN <ArrowRight size={15}/></Link></div>}
          <div className="account-panel-divider"></div>
          <p className="account-small-note">Your account credentials stay private. Membership status is read from your own account records.</p>
        </article>

        <section className="account-quick-links">
          <div className="account-quick-links-heading"><p className="eyebrow">EXPLORE RUBY ESSENTIALS</p><h2>YOUR <span className="accent">NEXT MOVE.</span></h2></div>
          <Link to="/events" className="account-quick-link"><span className="account-quick-icon"><Trophy size={18}/></span><span><strong>News & events</strong><small>See clan activities and updates.</small></span><ArrowUpRight size={17}/></Link>
          <Link to="/members" className="account-quick-link"><span className="account-quick-icon"><Users size={18}/></span><span><strong>Member roster</strong><small>Explore the Ruby Essentials lineup.</small></span><ArrowUpRight size={17}/></Link>
        </section>
      </div>

      <aside className="account-dashboard-sidebar">
        <article className="account-panel account-profile-panel">
          <div className="account-panel-heading"><div><p className="eyebrow">YOUR DETAILS</p><h2>ACCOUNT <span className="accent">PROFILE.</span></h2></div><span className="account-panel-icon"><UserRound size={19}/></span></div>
          <div className="account-profile-banner"><span className="account-profile-avatar">{userName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'RE'}</span><div><strong>{userName}</strong><small>{account?.email||'Signed-in Ruby member'}</small></div></div>
          <dl className="account-details-list">
            <div><dt>DISPLAY NAME</dt><dd>{userName}</dd></div>
            <div><dt>IN-GAME NAME</dt><dd>{ign||'Not provided'}</dd></div>
            <div><dt>ACCOUNT CREATED</dt><dd>{formatDate(createdAt)}</dd></div>
            <div><dt>PROFILE RECORD</dt><dd>{profile?'Saved':'Not created yet'}</dd></div>
          </dl>
          <div className="account-profile-foot"><ShieldCheck size={15}/><span>Signed in securely with your Ruby Essentials account.</span></div>
        </article>
      </aside>
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
            const {error:applicationError}=await supabase.from('join_applications').insert({user_id:user.id,display_name:displayName,ign:ign||null,email:user.email||email});
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
        const {error:applicationError}=await supabase.from('join_applications').insert({user_id:data.user.id,display_name:displayName,ign:ign||null,email:data.user.email||email});
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
function Admin(){
  const [loading,setLoading]=useState(true);
  const [isAdmin,setIsAdmin]=useState(false);
  const [applications,setApplications]=useState<ApplicationRow[]>([]);
  const [filter,setFilter]=useState<'pending'|'all'>('pending');
  const [busyId,setBusyId]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [refreshCount,setRefreshCount]=useState(0);
  const [realtimeStatus,setRealtimeStatus]=useState<'connecting'|'live'|'offline'>('connecting');

  useEffect(()=>{
    let active=true;
    let cleanupRealtime:(()=>void)|undefined;
    (async()=>{
      setLoading(true);setError('');setRealtimeStatus('connecting');
      try{
        const {supabase}=await import('./lib/supabase');
        const {data:{user},error:userError}=await supabase.auth.getUser();
        if(userError)throw userError;
        if(!user){
          if(active){setIsAdmin(false);setApplications([]);setRealtimeStatus('offline')}
          return;
        }
        const allowed=user.app_metadata?.role==='admin';
        if(active)setIsAdmin(allowed);
        if(!allowed){
          if(active){setApplications([]);setRealtimeStatus('offline')}
          return;
        }

        const reloadApplications=async()=>{
          try{
            const {data,error:queryError}=await supabase
              .from('join_applications')
              .select('id,user_id,display_name,ign,email,status,created_at')
              .order('created_at',{ascending:false});
            if(queryError)throw queryError;
            if(active)setApplications((data||[]) as ApplicationRow[]);
          }catch(e){
            if(active)setError(e instanceof Error?e.message:'Unable to refresh membership applications.');
          }
        };

        // Subscribe to inserts and status changes, then refresh the authoritative rows.
        const channel=supabase
          .channel('admin-join-applications-live')
          .on('postgres_changes',{event:'*',schema:'public',table:'join_applications'},()=>{
            void reloadApplications();
          })
          .subscribe((status)=>{
            if(!active)return;
            if(status==='SUBSCRIBED')setRealtimeStatus('live');
            else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')setRealtimeStatus('offline');
            else setRealtimeStatus('connecting');
          });
        cleanupRealtime=()=>{void supabase.removeChannel(channel)};
        await reloadApplications();
      }catch(e){
        if(active){setIsAdmin(false);setRealtimeStatus('offline');setError(e instanceof Error?e.message:'Unable to load membership applications.')}
      }finally{
        if(active)setLoading(false);
      }
    })();
    return()=>{active=false;cleanupRealtime?.()};
  },[refreshCount]);

  async function updateStatus(application:ApplicationRow,status:'approved'|'rejected'){
    setBusyId(application.id);setError('');setMessage('');
    try{
      const {supabase}=await import('./lib/supabase');
      const {data,error:updateError}=await supabase
        .from('join_applications')
        .update({status})
        .eq('id',application.id)
        .eq('status','pending')
        .select('id,status')
        .maybeSingle();
      if(updateError)throw updateError;
      if(!data)throw new Error('No status was changed. Refresh the list and confirm the request is still pending.');
      setApplications(current=>current.map(item=>item.id===application.id?{...item,status}:item));
      setMessage(`${application.display_name||application.email||'Application'} was ${status}.`);
    }catch(e){
      setError(e instanceof Error?e.message:'Could not update this application.');
    }finally{setBusyId(null)}
  }

  const visibleApplications=applications.filter(item=>filter==='all'||item.status==='pending');
  const pendingCount=applications.filter(item=>item.status==='pending').length;
  const realtimeLabel=realtimeStatus==='live'?'LIVE UPDATES':realtimeStatus==='connecting'?'CONNECTING…':'LIVE UPDATES OFF';

  return <main className="page section admin-review-page">
    <p className="eyebrow"><span className="accent">ADMIN / </span>CONTROL ROOM</p>
    <h1 className="page-title">MEMBERSHIP <span className="accent">REVIEW.</span></h1>
    <p className="muted page-intro">Review Ruby Essentials join requests and approve or reject each application.</p>
    {loading?<p className="admin-feedback" role="status">Checking administrator access and loading applications…</p>
    :!isAdmin?<section className="admin-access-denied"><Shield size={25}/><h2>ADMIN ACCESS REQUIRED.</h2><p>This page is restricted to designated administrators. Sign in with an admin account to review membership requests.</p><Link to="/login" className="landing-primary">GO TO LOGIN <ArrowUpRight size={16}/></Link></section>
    :<>
      <section className="admin-review-summary">
        <div><span className="eyebrow">PENDING REQUESTS</span><strong>{pendingCount}</strong></div>
        <div><span className="eyebrow">TOTAL APPLICATIONS</span><strong>{applications.length}</strong><small className={'admin-live-status '+realtimeStatus}><i aria-hidden="true"/>{realtimeLabel}</small></div>
        <button className="account-refresh" type="button" onClick={()=>setRefreshCount(value=>value+1)}><RefreshCw size={14}/> Refresh list</button>
      </section>
      <div className="admin-review-toolbar">
        <div><h2>JOIN APPLICATIONS</h2><p className="muted">Applicant details and review status.</p></div>
        <div className="admin-review-filters">
          <button type="button" className={filter==='pending'?'active':''} onClick={()=>setFilter('pending')}>Pending ({pendingCount})</button>
          <button type="button" className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All applications</button>
        </div>
      </div>
      {message&&<p className="admin-feedback success" role="status">{message}</p>}
      {error&&<p className="admin-feedback error" role="alert">{error}</p>}
      {visibleApplications.length===0?<div className="admin-empty-state"><CheckCircle2 size={24}/><strong>{filter==='pending'?'No pending applications':'No applications yet'}</strong><p className="muted">{filter==='pending'?'All current join requests have been reviewed.':'New join requests will appear here.'}</p></div>
      :<div className="admin-application-list">{visibleApplications.map(application=><article className="admin-application-row" key={application.id}>
        <div className="admin-applicant-avatar">{(application.display_name||'R').trim().slice(0,1).toUpperCase()}</div>
        <div className="admin-applicant-details">
          <strong>{application.display_name||'Unnamed applicant'}</strong>
          <span>{application.email||'Email unavailable'}</span>
          {application.ign&&<small>IGN: {application.ign}</small>}
          <small>Submitted {formatDate(application.created_at)}</small>
        </div>
        <span className={'admin-status status-'+application.status}>{application.status}</span>
        {application.status==='pending'?<div className="admin-application-actions">
          <button type="button" className="admin-approve-button" disabled={busyId!==null} onClick={()=>void updateStatus(application,'approved')}>{busyId===application.id?'Saving…':'Approve'}</button>
          <button type="button" className="admin-reject-button" disabled={busyId!==null} onClick={()=>void updateStatus(application,'rejected')}>Reject</button>
        </div>:<span className="admin-reviewed-label">Reviewed</span>}
      </article>)}</div>}
    </>}
    <div className="admin-review-footer"><Link to="/members" className="text-link">View roster <ArrowUpRight size={15}/></Link><Link to="/events" className="text-link">Manage clan updates <ArrowUpRight size={15}/></Link></div>
  </main>;
}
export default function App(){return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/dashboard" element={<AccountDashboard/>}/><Route path="/members" element={<Members/>}/><Route path="/gallery" element={<GalleryPage/>}/><Route path="/events" element={<Events/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/join" element={<AuthPage mode="join"/>}/><Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/><Route path="/reset-password" element={<AuthPage mode="reset"/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="page section"><h1 className="page-title">PAGE NOT FOUND<span className="accent">.</span></h1><Link to="/" className="text-link">Return home <ArrowUpRight size={17}/></Link></main>}/></Routes><Footer/></>}
