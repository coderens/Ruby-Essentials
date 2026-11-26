import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ArrowUpRight, Camera, CheckCircle2, Clock3, Eye, EyeOff, Gamepad2, House, LayoutDashboard, LogOut, Mail, Menu, Newspaper, RefreshCw, Shield, ShieldCheck, Trophy, UserRound, Users, X } from 'lucide-react';
import AdminContentManager from './AdminContentManager';



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

type PublicMemberRow = {
  id: string;
  display_name: string;
  ign: string | null;
  role: string;
  category: string;
  avatar_url: string | null;
  avatar_path: string | null;
  bio: string;
  division: string;
  featured: boolean;
  sort_order: number;
  membership_status: 'active' | 'alumni';
  resolved_avatar?: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
};

type ClanEventRow = {
  id: string;
  title: string;
  detail: string;
  starts_at: string | null;
  category: string;
  status: string;
  created_at: string;
};

type GalleryRow = {
  id: string;
  storage_path: string;
  caption: string;
  alt_text: string;
  category: string;
  sort_order: number;
  created_at: string;
  image_url?: string | null;
};

async function resolvePublicImage(storagePath?: string | null, directUrl?: string | null) {
  if (directUrl) return directUrl;
  if (!storagePath) return null;

  try {
    const { supabase } = await import('./lib/supabase');
    const { data, error } = await supabase
      .storage
      .from('ruby-gallery')
      .createSignedUrl(storagePath, 60 * 60);

    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
};

function AuthField({
  label,
  icon,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  ...inputProps
}: AuthFieldProps) {
  const inputId = useId();
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : inputProps.type;
  return (
    <div className="auth-field">
      <label className="auth-field-label" htmlFor={inputId}>{label}</label>
      <span className="uiverse-input-wrap">
        <span className="uiverse-input-icon" aria-hidden="true">{icon}</span>
        <input id={inputId} className="uiverse-input" {...inputProps} type={inputType} />
        {showPasswordToggle && (
          <button
            className="auth-password-toggle"
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </span>
    </div>
  );
}

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

function smoothScrollToSection(id:string){
  const target=document.getElementById(id);
  if(!target)return;
  const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
  target.scrollIntoView({behavior,block:'start',inline:'nearest'});
}
function Header(){
  const [open,setOpen]=useState(false);
  const [signingOut,setSigningOut]=useState(false);
  const [logoutError,setLogoutError]=useState('');
  const user=useAuthUser();
  const navigate=useNavigate();
  const location=useLocation();
  const headerRef=useRef<HTMLElement>(null);
  const [activeSection,setActiveSection]=useState('home');
  useEffect(()=>{
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    window.addEventListener('keydown',closeOnEscape);
    return()=>window.removeEventListener('keydown',closeOnEscape)
  },[]);
  useEffect(()=>{
    const closeOnOutsidePress=(event:PointerEvent)=>{
      if(!headerRef.current?.contains(event.target as Node))setOpen(false);
    };
    window.addEventListener('pointerdown',closeOnOutsidePress);
    return()=>window.removeEventListener('pointerdown',closeOnOutsidePress);
  },[]);
  const closeMenu=()=>setOpen(false);
  const handleSectionClick=(event:MouseEvent<HTMLAnchorElement>,id:string)=>{
    closeMenu();
    // On the landing page, scroll directly instead of changing routes or hashes.
    if(location.pathname==='/'){
      event.preventDefault();
      smoothScrollToSection(id);
    }
  };
  useEffect(()=>{
    if(location.pathname!=='/'){
      setActiveSection('');
      return;
    }
    const sectionIds=['home','ruby-official','latest','events','gallery'];
    const syncActiveSection=()=>{
      const passed=sectionIds.filter(id=>{
        const element=document.getElementById(id);
        return element && element.getBoundingClientRect().top<=150;
      });
      const next=passed.length?passed[passed.length-1]:'home';
      setActiveSection(current=>current===next?current:next);
    };
    window.addEventListener('scroll',syncActiveSection,{passive:true});
    syncActiveSection();
    return ()=>{
      window.removeEventListener('scroll',syncActiveSection);
    };
  },[location.pathname,location.hash]);
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
  return <header className="header" ref={headerRef}>
    <Brand/>
    <button className="mobile-toggle" type="button" onClick={()=>setOpen(value=>!value)} aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="primary-navigation">{open?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}</button>
    <nav id="primary-navigation" className={open?'nav nav-open':'nav'} aria-label="Main navigation">
      <Link to="/#home" className={activeSection==='home'?'active':''} aria-current={activeSection==='home'?'location':undefined} onClick={event=>handleSectionClick(event,'home')}><House size={14} aria-hidden="true"/><span>Home</span></Link>
      <Link to="/#ruby-official" className={activeSection==='ruby-official'?'active':''} aria-current={activeSection==='ruby-official'?'location':undefined} onClick={event=>handleSectionClick(event,'ruby-official')}><Users size={14} aria-hidden="true"/><span>Ruby Official</span></Link>
      <Link to="/#latest" className={activeSection==='latest'?'active':''} aria-current={activeSection==='latest'?'location':undefined} onClick={event=>handleSectionClick(event,'latest')}><Newspaper size={14} aria-hidden="true"/><span>News</span></Link>
      <Link to="/#events" className={activeSection==='events'?'active':''} aria-current={activeSection==='events'?'location':undefined} onClick={event=>handleSectionClick(event,'events')}><Trophy size={14} aria-hidden="true"/><span>Events</span></Link>
      <Link to="/#gallery" className={activeSection==='gallery'?'active':''} aria-current={activeSection==='gallery'?'location':undefined} onClick={event=>handleSectionClick(event,'gallery')}><Camera size={14} aria-hidden="true"/><span>Gallery</span></Link>
      {user&&<NavLink className="nav-dashboard" to="/dashboard" onClick={closeMenu}><LayoutDashboard size={14} aria-hidden="true"/><span>Dashboard</span></NavLink>}
      {user?.app_metadata?.role==='admin'&&<NavLink className="nav-dashboard" to="/admin" onClick={closeMenu}><ShieldCheck size={14} aria-hidden="true"/><span>Admin</span></NavLink>}
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
function ScrollToAnchor(){
  const location=useLocation();
  useLayoutEffect(()=>{
    if(location.pathname!=='/'||!location.hash) return;
    const sectionId=decodeURIComponent(location.hash.slice(1));
    smoothScrollToSection(sectionId);
  },[location.pathname,location.hash]);
  return null;
}
function Footer(){return <footer className="footer" id="contact"><Brand/><p>We The Confidence</p><small>© 2026 RUBY ESSENTIALS · CALL OF DUTY MOBILE ESPORTS</small></footer>}
function Home(){
  const user=useAuthUser();
  const primaryPath=user?'/dashboard':'/join';
  const primaryLabel=user?'OPEN DASHBOARD':'JOIN OUR CLAN';
  return <><main className="landing-home">
    <section className="landing-hero" id="home">
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
    <LatestUpdates />
    <Members />
    <Events />
    <GallerySection />
  </main></>
}
function LatestUpdates() {
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadAnnouncements() {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error: queryError } = await supabase
          .from('announcements')
          .select('id,title,body,category,created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (queryError) throw queryError;
        if (active) setItems((data || []) as AnnouncementRow[]);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load announcements.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAnnouncements();
    return () => { active = false; };
  }, []);

  return (
    <section className="latest-section" id="latest" aria-labelledby="latest-updates-heading">
      <div className="latest-intro">
        <p className="landing-kicker">LATEST UPDATES</p>
        <h2 id="latest-updates-heading">STAY <em>CONNECTED</em></h2>
        <p>Official announcements from Ruby Essentials.</p>
      </div>
      {loading ? (
        <p className="dynamic-content-state" role="status">Loading the latest announcements…</p>
      ) : error ? (
        <p className="dynamic-content-error" role="alert">Updates could not be loaded. {error}</p>
      ) : items.length === 0 ? (
        <div className="dynamic-content-state">
          <strong>No announcements published yet.</strong>
          <p>Official updates will appear here when the Ruby Essentials team publishes them.</p>
        </div>
      ) : (
        <div className="news-cards">
          {items.map(item => (
            <article className="news-card dynamic-news-card" key={item.id}>
              <div className="news-card-link">
                <div className="news-art news-art-crest">
                  <img src="/transparent%20logo.png" alt="" width="94" height="94" loading="lazy" decoding="async" />
                </div>
                <div className="news-copy">
                  <span>{item.category || 'ANNOUNCEMENT'}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="dynamic-section-link">
        <Link className="text-link" to="/events">Explore upcoming events <ArrowUpRight size={15} /></Link>
      </div>
    </section>
  );
}

function GallerySection() {
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadGallery() {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error: queryError } = await supabase
          .from('gallery_items')
          .select('id,storage_path,caption,alt_text,category,sort_order,created_at')
          .eq('published', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (queryError) throw queryError;
        const rows = (data || []) as GalleryRow[];
        const withImages = await Promise.all(rows.map(async item => ({
          ...item,
          image_url: await resolvePublicImage(item.storage_path),
        })));
        if (active) setItems(withImages);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load the gallery.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadGallery();
    return () => { active = false; };
  }, []);

  return (
    <section className="gallery-section" id="gallery" aria-labelledby="gallery-heading">
      <div className="gallery-section-heading">
        <div className="gallery-section-heading-copy">
          <h2 id="gallery-heading">RUBY <em>GALLERY.</em></h2>
          <p>Published memories and official media from Ruby Essentials.</p>
        </div>
      </div>
      {loading ? (
        <p className="dynamic-content-state" role="status">Loading gallery images…</p>
      ) : error ? (
        <p className="dynamic-content-error" role="alert">The gallery could not be loaded. {error}</p>
      ) : items.length === 0 ? (
        <div className="dynamic-content-state">
          <strong>No gallery images published yet.</strong>
          <p>Official photos will appear here after an administrator uploads and publishes them.</p>
        </div>
      ) : (
        <div className="gallery-collection-grid dynamic-gallery-grid">
          {items.map(item => (
            <article className="gallery-collection-card dynamic-gallery-card" key={item.id}>
              {item.image_url ? (
                <a className="dynamic-gallery-image-link" href={item.image_url} target="_blank" rel="noreferrer" aria-label={'Open full-size image: ' + (item.alt_text || item.caption)}>
                  <img className="dynamic-gallery-image" src={item.image_url} alt={item.alt_text || item.caption} loading="lazy" decoding="async" />
                </a>
              ) : (
                <div className="gallery-collection-visual dynamic-gallery-unavailable">
                  <span className="gallery-visual-placeholder">IMAGE UNAVAILABLE</span>
                </div>
              )}
              <div className="gallery-collection-copy">
                <p className="eyebrow">{item.category || 'RUBY ESSENTIALS'}</p>
                <h3>{item.caption}</h3>
                <p>{formatDate(item.created_at)}</p>
                {item.image_url && <a className="dynamic-full-image-link" href={item.image_url} target="_blank" rel="noreferrer">VIEW FULL IMAGE <ArrowUpRight size={14} /></a>}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="gallery-section-footer">
        <span>OUR STORY IS STILL BEING WRITTEN.</span>
        <Link to="/events" className="gallery-updates-link">EXPLORE CLAN EVENTS <ArrowUpRight size={15} /></Link>
      </div>
    </section>
  );
}

function GalleryPage() {
  return <main className="gallery-route-page"><GallerySection /></main>;
}

function Members() {
  const [memberType, setMemberType] = useState('All');
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<PublicMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadMembers() {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error: queryError } = await supabase
          .from('public_members')
          .select('id,display_name,ign,role,category,avatar_url,avatar_path,bio,division,featured,sort_order,membership_status')
          .eq('published', true)
          .eq('membership_status', 'active')
          .order('sort_order', { ascending: true })
          .order('display_name', { ascending: true });
        if (queryError) throw queryError;
        const rows = (data || []) as PublicMemberRow[];
        const withAvatars = await Promise.all(rows.map(async member => ({
          ...member,
          resolved_avatar: await resolvePublicImage(member.avatar_path, member.avatar_url),
        })));
        if (active) setMembers(withAvatars);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load the member directory.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadMembers();
    return () => { active = false; };
  }, []);

  const categories = ['All', ...Array.from(new Set(members.map(member => member.category).filter(Boolean)))];
  const query = memberSearch.trim().toLowerCase();
  const filteredMembers = members.filter(member =>
    (memberType === 'All' || member.category === memberType) &&
    (!query || [member.display_name, member.ign || '', member.role, member.category, member.division, member.bio]
      .some(value => value.toLowerCase().includes(query)))
  );

  return (
    <section className="ruby-directory-page" id="ruby-official">
      <section className="ruby-directory-intro">
        <div className="ruby-directory-intro-copy">
          <p className="landing-kicker"><span className="accent">RUBY ESSENTIALS</span><span className="ruby-directory-slash"> / </span>COMMUNITY</p>
          <h1>MEMBER <span className="accent">DIRECTORY</span></h1>
          <p>Meet the approved members and published profiles of Ruby Essentials.</p>
        </div>
      </section>
      <section className="ruby-directory-content" aria-labelledby="ruby-directory-heading">
        <div className="ruby-directory-toolbar">
          <div className="ruby-directory-toolbar-label"><span className="ruby-directory-live-dot" /> BROWSE THE ROSTER</div>
          <div className="ruby-directory-filters" role="group" aria-label="Filter members">
            {categories.map(type => (
              <button type="button" key={type} className={memberType === type ? 'ruby-directory-filter active' : 'ruby-directory-filter'} onClick={() => setMemberType(type)} aria-pressed={memberType === type}>{type}</button>
            ))}
          </div>
          <label className="ruby-directory-search">
            <Search size={17} aria-hidden="true" />
            <input type="search" value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="Search members…" aria-label="Search members by name, IGN, role, division, or biography" />
            {memberSearch && <button type="button" onClick={() => setMemberSearch('')} aria-label="Clear search">×</button>}
          </label>
        </div>
        <div className="ruby-directory-results-heading">
          <div><h2 id="ruby-directory-heading">THE <span className="accent">ROSTER</span></h2><p>Only intentionally published member profiles appear here.</p></div>
          <span>{loading ? 'LOADING…' : filteredMembers.length + ' RESULTS'}</span>
        </div>
        {loading ? (
          <p className="dynamic-content-state" role="status">Loading approved member profiles…</p>
        ) : error ? (
          <p className="dynamic-content-error" role="alert">The directory could not be loaded. {error}</p>
        ) : filteredMembers.length > 0 ? (
          <div className="ruby-directory-grid">
            {filteredMembers.map(member => (
              <article className="ruby-directory-member" key={member.id}>
                <div className="ruby-directory-member-top">
                  <span className="ruby-directory-member-type">{member.category}</span>
                  {member.featured && <span className="dynamic-featured-label">FEATURED</span>}
                </div>
                <div className="ruby-directory-avatar">
                  <img src={member.resolved_avatar || '/transparent%20logo.png'} alt={member.resolved_avatar ? member.display_name + ' profile' : ''} loading="lazy" decoding="async" />
                </div>
                <div className="ruby-directory-member-copy">
                  <h3>{member.display_name}</h3>
                  <p>{member.ign ? 'IGN: ' + member.ign : member.role}</p>
                  <p className="dynamic-member-bio">{member.bio || member.division}</p>
                </div>
                <div className="ruby-directory-member-bottom">
                  <span><i /> {member.role.toUpperCase()}</span>
                  <span className="ruby-directory-member-arrow"><ArrowUpRight size={17} aria-hidden="true" /></span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="directorate-empty-state">
            <strong>{members.length === 0 ? 'No member profiles published yet.' : 'No members found.'}</strong>
            <p>{members.length === 0 ? 'The roster will appear here when administrators publish member profiles.' : 'Try another search or category.'}</p>
            <button className="ruby-directory-reset" type="button" onClick={() => { setMemberSearch(''); setMemberType('All'); }}>Reset filters</button>
          </div>
        )}
        <div className="ruby-directory-join">
          <div><span>YOUR PLACE COULD BE HERE</span><h2>JOIN THE <em>RUBY FAMILY.</em></h2></div>
          <Link className="landing-primary" to="/join">APPLY TO JOIN <ArrowUpRight size={17} /></Link>
        </div>
      </section>
    </section>
  );
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
  const statusLabel=isAdmin?'Administrator access':requestStatus==='pending'?'Pending review':requestStatus==='approved'?'Approved':requestStatus==='rejected'?'Not approved':'No request yet';
  const statusDescription=isAdmin
    ?'Your account has administrator permissions. You can review and manage Ruby Essentials membership applications.'
    :requestStatus==='pending'
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
            <div><p className="eyebrow">{isAdmin?'ADMINISTRATOR ACCOUNT':'CLAN APPLICATION'}</p><h2>{isAdmin?<>ADMIN <span className="accent">ACCESS.</span></>:<>MEMBERSHIP <span className="accent">STATUS.</span></>}</h2></div>
            <span className={'account-status-pill '+(isAdmin?'status-approved':'status-'+requestStatus)}>{isAdmin?'ADMIN':requestStatus==='pending'?'UNDER REVIEW':requestStatus==='approved'?'APPROVED':requestStatus==='rejected'?'NOT APPROVED':'NOT SUBMITTED'}</span>
          </div>
          <div className="membership-status-visual">
            <span className={'membership-status-symbol '+(isAdmin?'status-approved':'status-'+requestStatus)}>{isAdmin?<ShieldCheck size={24}/>:requestStatus==='approved'?<CheckCircle2 size={24}/>:requestStatus==='pending'?<Clock3 size={24}/>:<Shield size={24}/>}</span>
            <div><strong>{statusLabel}</strong><p>{statusDescription}</p></div>
          </div>
          {!isAdmin&&application&&<p className="account-request-date">REQUEST SUBMITTED <strong>{formatDate(application.created_at)}</strong></p>}
          {!isAdmin&&!application&&<div className="account-application-cta"><div><strong>Ready to join the roster?</strong><p>Send a membership request to the Ruby Essentials team.</p></div><Link to="/join" className="account-inline-action">REQUEST TO JOIN <ArrowRight size={15}/></Link></div>}
          <div className="account-panel-divider"></div>
          <p className="account-small-note">{isAdmin?'Administrator permissions are assigned securely to your account. Use the review button above to manage membership requests.':'Your account credentials stay private. Membership status is read from your own account records.'}</p>
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

function Events() {
  const [items, setItems] = useState<ClanEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error: queryError } = await supabase
          .from('events')
          .select('id,title,detail,starts_at,category,status,created_at')
          .eq('published', true)
          .order('starts_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (queryError) throw queryError;
        if (active) setItems((data || []) as ClanEventRow[]);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load published events.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadEvents();
    return () => { active = false; };
  }, []);

  return (
    <section className="page section dynamic-events-section" id="events" aria-labelledby="events-heading">
      <p className="eyebrow"><span className="accent">02 / </span>CLAN ACTIVITIES</p>
      <h1 className="page-title" id="events-heading">EVENTS & <span className="accent">UPDATES.</span></h1>
      <p className="muted page-intro">Official scrims, tournaments, and community activities published by Ruby Essentials.</p>
      {loading ? (
        <p className="dynamic-content-state" role="status">Loading published events…</p>
      ) : error ? (
        <p className="dynamic-content-error" role="alert">Events could not be loaded. {error}</p>
      ) : items.length === 0 ? (
        <div className="dynamic-content-state">
          <strong>No upcoming events published yet.</strong>
          <p>Check back when the Ruby Essentials team announces its next activity.</p>
        </div>
      ) : (
        <div className="event-grid">
          {items.map(item => (
            <article className="event-card" key={item.id}>
              <div className="card-top">
                <span className="game-icon"><Trophy size={20} /></span>
                <span className="status">{(item.status || 'upcoming').replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <p className="eyebrow">{item.category || 'CLAN EVENT'}</p>
              <h3>{item.title}</h3>
              <p className="muted">{item.detail}</p>
              <div className="dynamic-event-date">
                <Clock3 size={14} />
                <time dateTime={item.starts_at || undefined}>{item.starts_at ? formatDate(item.starts_at) : 'DATE TO BE ANNOUNCED'}</time>
              </div>
              <Link className="card-action" to="/#latest">Read latest updates <ArrowUpRight size={15} /></Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}



function likelyEmailDomainFix(email:string){
  const at=email.lastIndexOf('@');
  if(at<0)return null;
  const local=email.slice(0,at);
  const domain=email.slice(at+1).toLowerCase();
  const commonTypos:Record<string,string>={
    'gmail.cm':'gmail.com',
    'gmai.com':'gmail.com',
    'gmal.com':'gmail.com',
    'gmial.com':'gmail.com',
    'gamil.com':'gmail.com',
    'hotnail.com':'hotmail.com',
    'hotmai.com':'hotmail.com',
    'hotmial.com':'hotmail.com',
    'outlok.com':'outlook.com',
    'outloo.com':'outlook.com',
    'yaho.com':'yahoo.com',
    'yahooo.com':'yahoo.com'
  };
  const corrected=commonTypos[domain];
  return corrected ? local+'@'+corrected : null;
}
function AuthPage({mode}:{mode:'login'|'join'|'forgot'|'reset'}){
  const navigate=useNavigate();
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirmPassword,setShowConfirmPassword]=useState(false);
  const [canResendConfirmation,setCanResendConfirmation]=useState(false);
  const [confirmationEmail,setConfirmationEmail]=useState('');
  const [checkingSession,setCheckingSession]=useState(mode==='login');
  const manualAuthInProgress=useRef(false);
  const configured=Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const authRedirectUrl=window.location.origin;

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
  async function resendConfirmation(){
    if(!confirmationEmail||!configured)return;
    setBusy(true);
    setMessage('');
    try{
      const {supabase}=await import('./lib/supabase');
      const {error}=await supabase.auth.resend({
        type:'signup',
        email:confirmationEmail,
        options:{emailRedirectTo:authRedirectUrl+'/login'}
      });
      if(error) throw error;
      setMessage('A new confirmation email has been requested. Check your inbox and spam folder. Please wait a minute before requesting another link.');
    }catch(err){
      const error=err as {message?:string};
      setMessage(error.message||'We could not resend the confirmation email. Please try again shortly.');
    }finally{
      setBusy(false);
    }
  }
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    manualAuthInProgress.current=true;
    const formElement=e.currentTarget;
    const form=new FormData(formElement);
    setMessage('');setCanResendConfirmation(false);setConfirmationEmail('');setBusy(true);
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
        if(error){
          const authError=error as {code?:string;message:string};
          if(authError.code==='email_not_confirmed'||authError.message.toLowerCase().includes('email not confirmed')){
            setConfirmationEmail(email);
            setCanResendConfirmation(true);
            setMessage('Your email address has not been confirmed yet. Request a fresh confirmation link below, then open it from your inbox.');
            return;
          }
          throw error;
        }
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
      const suggestedEmail=likelyEmailDomainFix(email);
      if(suggestedEmail){
        throw new Error('Please check the email address. Did you mean '+suggestedEmail+'? Confirmation emails must go to an inbox you can access.');
      }
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:authRedirectUrl+'/login',data:{display_name:displayName,ign}}});
      if(error) throw error;
      // Supabase intentionally returns an obfuscated user with no identities when
      // the email already belongs to an existing account. No new confirmation is sent.
      if(data.user && data.user.identities?.length===0){
        setMessage('An account with this email already exists. Please log in instead, or use Forgot password if you cannot access it.');
        return;
      }
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
  return <main className="auth-wrap"><div className="auth-card"><div className="auth-symbol"><img className="auth-logo" src="/transparent%20logo.png" alt="Ruby Essentials logo"/></div><p className="eyebrow">RUBY ESSENTIALS ACCOUNT</p><h1>{mode==='login'?'WELCOME BACK.':mode==='join'?'JOIN THE CLAN.':mode==='reset'?'CHOOSE A NEW PASSWORD.':'RESET ACCESS.'}</h1><p className="muted">{mode==='login'?'Sign in to your Ruby Essentials account.':mode==='join'?'Create your account and submit a membership request.':mode==='reset'?'Choose a new password for your account.':'Enter your account email to receive a password reset link.'}</p><form onSubmit={submit}>{mode==='join'&&<AuthField label="Display name" icon={<UserRound size={22} strokeWidth={1.6}/>} name="displayName" required minLength={2} maxLength={60} autoComplete="nickname" placeholder="Your name or clan alias"/>}{mode!=='reset'&&<AuthField label="Email address" icon={<Mail size={22} strokeWidth={1.6}/>} name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/>}{mode!=='forgot'&&<AuthField label={mode==='reset'?'New password':'Password'} icon={<Shield size={22} strokeWidth={1.6}/>} name="password" type="password" showPasswordToggle showPassword={showPassword} onTogglePassword={()=>setShowPassword(value=>!value)} required minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="At least 8 characters"/>}{(mode==='join'||mode==='reset')&&<AuthField label="Confirm password" icon={<ShieldCheck size={22} strokeWidth={1.6}/>} name="confirmPassword" type="password" showPasswordToggle showPassword={showConfirmPassword} onTogglePassword={()=>setShowConfirmPassword(value=>!value)} required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Enter password again"/>}{mode==='join'&&<AuthField label="In-game name" icon={<Gamepad2 size={22} strokeWidth={1.6}/>} name="ign" maxLength={40} autoComplete="off" placeholder="Your IGN"/>}<button className="btn auth-submit" disabled={busy||!configured}>{busy?'Please wait…':mode==='login'?'Log in':mode==='join'?'Create account & request to join':mode==='reset'?'Update password':'Send reset link'} <ArrowUpRight size={17}/></button></form>{message&&<p className="form-message" role="status">{message}</p>}{mode==='login'&&canResendConfirmation&&<button className="btn auth-submit auth-resend-confirmation" type="button" onClick={resendConfirmation} disabled={busy||!configured}>{busy?'Sending…':'Resend confirmation email'} <ArrowUpRight size={17}/></button>}{!configured&&<p className="hint">Account services are not configured yet. Please try again later.</p>}<div className="auth-bottom">{mode==='login'?<><Link to="/forgot-password">Forgot password?</Link><span>New to Ruby? <Link to="/join">Request to join</Link></span></>:mode==='join'?<span>Already have an account? <Link to="/login">Log in</Link></span>:mode==='reset'?<span>Remembered it? <Link to="/login">Back to login</Link></span>:<span>Remembered it? <Link to="/login">Back to login</Link></span>}</div></div></main>
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

  async function sendDecisionEmail(applicationId:string){
    const {supabase}=await import('./lib/supabase');
    const {data,error:emailError}=await supabase.functions.invoke('notify-application-status',{body:{applicationId}});
    if(emailError)throw new Error(emailError.message||'Email notification could not be sent.');
    if(!data?.sent)throw new Error(data?.error||'Email notification could not be sent.');
    return data as {sent:boolean;to?:string;emailId?:string|null};
  }

  async function updateStatus(application:ApplicationRow,status:'approved'|'rejected'){
    setBusyId(application.id);setError('');setMessage('');
    const applicantName=application.display_name||application.email||'Application';
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
      try{
        const notification=await sendDecisionEmail(application.id);
        setMessage(`${applicantName} was ${status}. The notification email was sent to ${notification.to||application.email||'the applicant'}.`);
      }catch(emailError){
        const emailMessage=emailError instanceof Error?emailError.message:'Unknown email sending error.';
        setError(`${applicantName} was ${status}, but the email was not sent. ${emailMessage} After email setup, use Resend email to retry.`);
      }
    }catch(e){
      setError(e instanceof Error?e.message:'Could not update this application.');
    }finally{setBusyId(null)}
  }

  async function resendDecisionEmail(application:ApplicationRow){
    setBusyId(application.id);setError('');setMessage('');
    try{
      const notification=await sendDecisionEmail(application.id);
      setMessage(`Decision email sent to ${notification.to||application.email||'the applicant'}.`);
    }catch(e){
      const reason=e instanceof Error?e.message:'Unknown email sending error.';
      setError(`Email could not be sent. ${reason}`);
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
        </div>:<div className="admin-reviewed-actions"><span className="admin-reviewed-label">Reviewed</span><button type="button" className="admin-resend-button" disabled={busyId!==null} onClick={()=>void resendDecisionEmail(application)}>{busyId===application.id?'Sending…':'Resend email'}</button></div>}
      </article>)}</div>}
    </>}
    <div className="admin-review-footer"><Link to="/members" className="text-link">View roster <ArrowUpRight size={15}/></Link><Link to="/events" className="text-link">View clan updates <ArrowUpRight size={15}/></Link><Link to="/admin/content" className="text-link">Manage website content <ArrowUpRight size={15}/></Link></div>
  </main>;
}
export default function App(){return <><Header/><ScrollToAnchor/><Routes><Route path="/" element={<Home/>}/><Route path="/dashboard" element={<AccountDashboard/>}/><Route path="/members" element={<Members/>}/><Route path="/gallery" element={<GalleryPage/>}/><Route path="/events" element={<Events/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/join" element={<AuthPage mode="join"/>}/><Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/><Route path="/reset-password" element={<AuthPage mode="reset"/>}/><Route path="/admin" element={<Admin/>}/><Route path="/admin/content" element={<AdminContentManager/>}/><Route path="*" element={<main className="page section"><h1 className="page-title">PAGE NOT FOUND<span className="accent">.</span></h1><Link to="/" className="text-link">Return home <ArrowUpRight size={17}/></Link></main>}/></Routes><Footer/></>}
