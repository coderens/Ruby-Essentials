import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Gamepad2, Menu, Shield, Trophy, Users } from 'lucide-react';

const events = [
  { type: 'CLAN EVENT', title: 'Ruby Scrim Night', date: 'COMING SOON', detail: 'Team practice · Custom rooms' },
  { type: 'COMMUNITY', title: 'Recruitment Open', date: 'NOW OPEN', detail: 'Meet the clan · Apply to join' },
  { type: 'COMPETITIVE', title: 'Weekly Showdown', date: 'UPCOMING', detail: 'Competitive matches · Teamwork' },
];
function Brand(){return <Link to="/" className="brand" aria-label="Ruby Essentials home"><img className="brand-logo" src="/transparent%20logo.png" alt="" width="66" height="66"/><span className="brand-name"><b>RUBY</b><strong>ESSENTIALS</strong></span></Link>}
function Header(){const [open,setOpen]=useState(false);useEffect(()=>{const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',closeOnEscape);return()=>window.removeEventListener('keydown',closeOnEscape)},[]);const closeMenu=()=>setOpen(false);return <header className="header"><Brand/><button className="mobile-toggle" type="button" onClick={()=>setOpen(value=>!value)} aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="primary-navigation"><Menu aria-hidden="true"/></button><nav id="primary-navigation" className={open?'nav nav-open':'nav'} aria-label="Main navigation"><NavLink to="/" end onClick={closeMenu}>Home</NavLink><a href="/#about" onClick={closeMenu}>About</a><NavLink to="/members" onClick={closeMenu}>Roster</NavLink><NavLink to="/events" onClick={closeMenu}>News</NavLink><a href="/#gallery" onClick={closeMenu}>Gallery</a><a href="/#contact" onClick={closeMenu}>Contact</a></nav><div className="header-actions"><Link className="login-link" to="/login">⇥ &nbsp; Login / Register</Link></div></header>}
function Footer(){return <footer className="footer" id="contact"><Brand/><p>More than just a clan. We are a family.</p><small>© 2026 RUBY ESSENTIALS · CALL OF DUTY MOBILE ESPORTS</small></footer>}
function Home(){return <><main className="landing-home"><section className="landing-hero"><div className="landing-copy"><p className="landing-kicker">CALL OF DUTY MOBILE ESPORTS CLAN</p><h1><span>RUBY</span><strong>ESSENTIALS</strong></h1><p className="landing-tagline">MORE THAN JUST A CLAN<br/>WE ARE A FAMILY</p><div className="landing-actions"><Link className="landing-primary" to="/join"><img src="/transparent%20logo.png" alt="" width="42" height="42" loading="lazy" decoding="async"/> JOIN OUR CLAN <ArrowUpRight size={17}/></Link><a className="landing-secondary" href="#about"><Shield size={15}/> LEARN MORE</a></div></div><div className="landing-crest"><div className="crest-glow"></div><img src="/transparent%20logo.png" alt="Ruby Essentials logo" width="420" height="450" fetchPriority="high" decoding="async"/></div></section>
<section className="mission-grid" id="about"><article className="mission-card"><img src="/transparent%20logo.png" alt=""/><h2>OUR <em>MISSION</em></h2><p>To build a competitive and supportive community in<br className="desktop-only"/> Call of Duty Mobile.</p><a href="#latest" aria-label="Read our mission">⟶</a></article><article className="mission-card"><img src="/transparent%20logo.png" alt=""/><h2>OUR <em>VISION</em></h2><p>To become one of the most respected and recognized<br className="desktop-only"/> CODM clans in the region.</p><a href="/members" aria-label="Meet the roster">⟶</a></article><article className="mission-card"><img src="/transparent%20logo.png" alt=""/><h2>OUR <em>VALUES</em></h2><ul><li>Teamwork</li><li>Discipline</li><li>Respect</li><li>Growth</li></ul><a href="/members" aria-label="Meet the team">⟶</a></article><article className="mission-card"><img src="/transparent%20logo.png" alt=""/><h2>OUR <em>COMMUNITY</em></h2><p>Real players. Real bonds.<br/>One goal.</p><a href="/join" aria-label="Join the community">⟶</a></article></section>
<section className="latest-section" id="latest"><div className="latest-intro"><p className="landing-kicker">LATEST UPDATES</p><h2>STAY <em>CONNECTED</em></h2><p>Get the latest news, events, and announcements from Ruby Essentials.</p></div><div className="news-cards"><article className="news-card"><Link className="news-card-link" to="/events" aria-label="Read Welcome to Our New Website update"><div className="news-art news-art-crest"><img src="/transparent%20logo.png" alt="Ruby Essentials" width="94" height="94" loading="lazy" decoding="async"/></div><div className="news-copy"><span>ANNOUNCEMENT</span><h3>Welcome to Our New Website</h3><p>We're excited to officially launch our clan website. Stay tuned for updates, events, and more!</p><time>CLAN UPDATE</time></div></Link></article><article className="news-card"><Link className="news-card-link" to="/events" aria-label="View CODM Scrim Schedule"><div className="news-art news-art-soldier"><div className="soldier-visor"></div><div className="soldier-body"></div></div><div className="news-copy"><span>EVENT</span><h3>CODM Scrim Schedule</h3><p>Check out our upcoming scrim schedule and be ready for the action!</p><time>SCHEDULE TBA</time></div></Link></article></div></section>
<section className="gallery-strip" id="gallery"><p className="landing-kicker">ONE CLAN. ONE FAMILY.</p><h2>READY TO REPRESENT <em>RUBY?</em></h2><Link className="landing-primary" to="/join">JOIN OUR CLAN <ArrowUpRight size={17}/></Link></section></main></>}
function Members(){const slots=[1,2,3,4,5];return <main className="page section roster-page"><p className="eyebrow"><span className="accent">01 / </span>THE ROSTER</p><h1 className="page-title">MEET THE <span className="accent">CLAN.</span></h1><p className="muted page-intro">Meet the players behind the tag. Official names and roles will appear here as the lineup is confirmed.</p><div className="roster-panel-heading"><span className="roster-status"><span></span> ROSTER REVEAL IN PROGRESS</span><span className="roster-count">05 PLAYER SLOTS</span></div><section className="roster-panel-grid" aria-label="Roster player panels">{slots.map(slot=><article className="roster-player-panel" key={slot}><div className="roster-panel-art"><span className="roster-panel-number">0{slot}</span><div className="roster-panel-sheen"></div><img src="/transparent%20logo.png" alt="Ruby Essentials emblem" loading="lazy" decoding="async"/><span className="roster-panel-tag">RUBY ESSENTIALS</span></div><div className="roster-panel-info"><p className="eyebrow">PLAYER SLOT 0{slot}</p><h2>[IGN]</h2><div className="roster-panel-divider"></div><div className="roster-panel-meta"><span>IN-GAME NAME</span><strong>COMING SOON</strong></div><div className="roster-panel-meta"><span>ROLE</span><strong>TO BE ANNOUNCED</strong></div></div></article>)}</section><div className="roster-panel-footer"><p>Real players. Real bonds. One goal.</p><Link className="landing-primary roster-join" to="/join">JOIN OUR CLAN <ArrowUpRight size={16}/></Link></div></main>}
function Events(){return <main className="page section"><p className="eyebrow"><span className="accent">02 / </span>CLAN ACTIVITIES</p><h1 className="page-title">EVENTS & <span className="accent">UPDATES.</span></h1><p className="muted page-intro">Clan scrims, recruitment updates, and community activities in one place.</p><div className="event-grid">{events.map((e,i)=><article className="event-card" key={e.title}><div className="card-top"><span className="game-icon">{i===0?<Gamepad2 size={20}/>:i===1?<Users size={20}/>:<Trophy size={20}/>}</span><span className={'status '+(i===1?'live':'')}>{e.date}</span></div><p className="eyebrow">{e.type}</p><h3>{e.title}</h3><p className="muted">{e.detail}</p><Link className="card-action" to={i===1?"/join":"/#contact"}>{i===1?"Apply to join":"Get involved"} <ArrowUpRight size={15}/></Link></article>)}</div></main>}
function AuthPage({mode}:{mode:'login'|'join'|'forgot'|'reset'}){
  const navigate=useNavigate();
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [emailForResend,setEmailForResend]=useState('');
  const configured=Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);\n  const authRedirectUrl='https://ruby-essentials.vercel.app';
  async function resendVerification(){
    setMessage('');setBusy(true);
    try{
      if(!configured) throw new Error('Account services are not configured yet.');
      const {supabase}=await import('./lib/supabase');
      const email=emailForResend.trim();
      if(!email) throw new Error('Enter your email address first.');
      const {error}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:authRedirectUrl+'/login'}});
      if(error) throw error;
      setMessage('If this address has an unconfirmed account, a verification email will be sent. Check your inbox and spam folder.');
    }catch(err){const error=err as {message?:string};setMessage(error.message||'Could not resend verification email. Please try again.');}
    finally{setBusy(false)}
  }
  async function signInWithGoogle(){
    setMessage('');setBusy(true);
    try{
      if(!configured) throw new Error('Account services are not configured yet.');
      const {supabase}=await import('./lib/supabase');
      const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:authRedirectUrl+'/members'}});
      if(error) throw error;
    }catch(err){const error=err as {message?:string};setMessage(error.message||'Google sign-in could not be started.');setBusy(false);}
  }
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMessage('');setBusy(true);
    try{
      if(!configured) throw new Error('Account services are not configured yet. Please try again later.');
      const { supabase } = await import('./lib/supabase');
      const form=new FormData(e.currentTarget);
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
        navigate('/members',{replace:true});
        return;
      }
      const confirmation=String(form.get('confirmPassword')||'');
      if(password.length<8) throw new Error('Your password must be at least 8 characters.');
      if(password!==confirmation) throw new Error('The passwords do not match.');
      const displayName=String(form.get('displayName')||'').trim();
      const ign=String(form.get('ign')||'').trim();
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/login',data:{display_name:displayName,ign}}});
      if(error) throw error;
      if(data.session && data.user){
        const {error:profileError}=await supabase.from('profiles').upsert({id:data.user.id,display_name:displayName,ign:ign||null},{onConflict:'id'});
        if(profileError) throw profileError;
        const {error:applicationError}=await supabase.from('join_applications').insert({user_id:data.user.id,display_name:displayName,ign:ign||null});
        if(applicationError) throw applicationError;
        setMessage('Your account was created and your join request submitted.');
      }else{
        setMessage('Account created. Check your email to confirm your address, then log in to complete your membership request.');
      }
    }catch(err){
      const error=err as {message?:string};
      setMessage(error.message||'Something went wrong. Please try again.');
    }finally{setBusy(false)}
  }
  return <main className="auth-wrap"><div className="auth-card"><div className="auth-symbol"><img className="auth-logo" src="/transparent%20logo.png" alt="Ruby Essentials logo"/></div><p className="eyebrow">RUBY ESSENTIALS ACCOUNT</p><h1>{mode==='login'?'WELCOME BACK.':mode==='join'?'JOIN THE CLAN.':mode==='reset'?'CHOOSE A NEW PASSWORD.':'RESET ACCESS.'}</h1><p className="muted">{mode==='login'?'Sign in to your Ruby Essentials account.':mode==='join'?'Create your account and submit a membership request.':mode==='reset'?'Choose a new password for your account.':'Enter your account email to receive a password reset link.'}</p><form onSubmit={submit}>{mode==='join'&&<label>Display name<input name="displayName" required minLength={2} maxLength={60} placeholder="Your name or clan alias"/></label>}{mode!=='reset'&&<label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>}{mode!=='forgot'&&<label>{mode==='reset'?'New password':'Password'}<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="At least 8 characters"/></label>}{(mode==='join'||mode==='reset')&&<label>Confirm password<input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Enter password again"/></label>}{mode==='join'&&<label>In-game name<input name="ign" maxLength={40} placeholder="Your IGN"/></label>}<button className="btn auth-submit" disabled={busy||!configured}>{busy?'Please wait…':mode==='login'?'Log in':mode==='join'?'Create account & request to join':mode==='reset'?'Update password':'Send reset link'} <ArrowUpRight size={17}/></button></form>{message&&<p className="form-message" role="status">{message}</p>}{(mode==='login'||mode==='join')&&<><button type="button" className="btn auth-submit" disabled={busy||!configured} onClick={signInWithGoogle}>Continue with Google</button><label>Resend verification email<input type="email" value={emailForResend} onChange={e=>setEmailForResend(e.target.value)} autoComplete="email" placeholder="you@example.com"/></label><button type="button" className="btn auth-submit" disabled={busy||!configured||!emailForResend.trim()} onClick={resendVerification}>{busy?'Please wait…':'Resend verification email'}</button></>}{!configured&&<p className="hint">Account services are not configured yet. Please try again later.</p>}<div className="auth-bottom">{mode==='login'?<><Link to="/forgot-password">Forgot password?</Link><span>New to Ruby? <Link to="/join">Request to join</Link></span></>:mode==='join'?<span>Already have an account? <Link to="/login">Log in</Link></span>:mode==='reset'?<span>Remembered it? <Link to="/login">Back to login</Link></span>:<span>Remembered it? <Link to="/login">Back to login</Link></span>}</div></div></main>
}
function Admin(){return <main className="page section"><p className="eyebrow"><span className="accent">ADMIN / </span>CONTROL ROOM</p><h1 className="page-title">CLAN <span className="accent">CENTER.</span></h1><p className="muted page-intro">Admin dashboard preview. Secure roles and backend access must be configured before live member data can be managed.</p><div className="admin-grid"><Link to="/members" className="admin-action"><span className="muted">MEMBERS</span><strong>View roster</strong><p className="muted">Browse member profiles and clan roles.</p><span className="card-action">Open roster <ArrowUpRight size={15}/></span></Link><Link to="/events" className="admin-action"><span className="muted">EVENTS</span><strong>View updates</strong><p className="muted">Browse scrims, announcements, and activities.</p><span className="card-action">Open events <ArrowUpRight size={15}/></span></Link><Link to="/join" className="admin-action"><span className="muted">APPLICATIONS</span><strong>Join requests</strong><p className="muted">Open the membership request form.</p><span className="card-action">View join form <ArrowUpRight size={15}/></span></Link></div><p className="hint">This is a visual prototype only. Add authenticated, role-protected backend routes before using it for real administration.</p></main>}
export default function App(){return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/members" element={<Members/>}/><Route path="/events" element={<Events/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/join" element={<AuthPage mode="join"/>}/><Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/><Route path="/reset-password" element={<AuthPage mode="reset"/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="page section"><h1 className="page-title">PAGE NOT FOUND<span className="accent">.</span></h1><Link to="/" className="text-link">Return home <ArrowUpRight size={17}/></Link></main>}/></Routes><Footer/></>}
