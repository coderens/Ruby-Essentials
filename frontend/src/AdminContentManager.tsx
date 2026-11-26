import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle2, ImagePlus, LoaderCircle, Pencil, Plus, Save, ShieldAlert, Trash2, Upload, X } from 'lucide-react';
import './content-admin.css';

type ContentTab = 'announcements' | 'events' | 'members' | 'gallery';

type ContentRow = {
  id: string;
  title?: string;
  body?: string;
  detail?: string;
  category?: string;
  status?: string;
  starts_at?: string | null;
  display_name?: string;
  ign?: string | null;
  role?: string;
  division?: string;
  bio?: string;
  avatar_url?: string | null;
  avatar_path?: string | null;
  membership_status?: 'active' | 'alumni';
  featured?: boolean;
  caption?: string;
  alt_text?: string;
  storage_path?: string;
  sort_order?: number;
  published: boolean;
  created_at?: string;
};

type ContentForm = {
  title: string;
  body: string;
  detail: string;
  category: string;
  status: string;
  startsAt: string;
  displayName: string;
  ign: string;
  role: string;
  division: string;
  bio: string;
  avatarUrl: string;
  membershipStatus: 'active' | 'alumni';
  featured: boolean;
  caption: string;
  altText: string;
  sortOrder: number;
  published: boolean;
};

const emptyForm: ContentForm = {
  title: '', body: '', detail: '', category: 'Community', status: 'upcoming',
  startsAt: '', displayName: '', ign: '', role: 'Member', division: 'Main',
  bio: '', avatarUrl: '', membershipStatus: 'active', featured: false,
  caption: '', altText: '', sortOrder: 0, published: false,
};

const tabs: { id: ContentTab; label: string; description: string }[] = [
  { id: 'announcements', label: 'News', description: 'Publish official announcements and updates.' },
  { id: 'events', label: 'Events', description: 'Manage scrims, tournaments, and community activities.' },
  { id: 'members', label: 'Members', description: 'Manage approved, public member profiles.' },
  { id: 'gallery', label: 'Gallery', description: 'Upload and publish official Ruby Essentials photos.' },
];

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageBytes = 10 * 1024 * 1024;

async function removeStorageFile(path: string) {
  const { supabase } = await import('./lib/supabase');
  const { error } = await supabase.storage.from('ruby-gallery').remove([path]);
  if (error) throw error;
}

function displayTitle(tab: ContentTab, row: ContentRow) {
  if (tab === 'members') return row.display_name || 'Unnamed member';
  if (tab === 'gallery') return row.caption || 'Untitled gallery item';
  return row.title || 'Untitled item';
}

function rowDetails(tab: ContentTab, row: ContentRow) {
  if (tab === 'members') return [row.ign ? 'IGN: ' + row.ign : null, row.role, row.division].filter(Boolean).join(' · ');
  if (tab === 'gallery') return [row.category, row.alt_text].filter(Boolean).join(' · ');
  if (tab === 'events') return [row.category, row.status, row.starts_at ? new Date(row.starts_at).toLocaleString() : 'Date to be announced'].filter(Boolean).join(' · ');
  return [row.category, row.created_at ? new Date(row.created_at).toLocaleDateString() : null].filter(Boolean).join(' · ');
}

export default function AdminContentManager() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('announcements');
  const [announcements, setAnnouncements] = useState<ContentRow[]>([]);
  const [events, setEvents] = useState<ContentRow[]>([]);
  const [members, setMembers] = useState<ContentRow[]>([]);
  const [gallery, setGallery] = useState<ContentRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentStoragePath, setCurrentStoragePath] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (active) setAuthorized(data.user?.app_metadata?.role === 'admin');
      } catch {
        if (active) setAuthorized(false);
      } finally {
        if (active) setChecking(false);
      }
    }
    void verifyAdmin();
    return () => { active = false; };
  }, []);

  async function loadContent() {
    setLoading(true);
    setError('');
    try {
      const { supabase } = await import('./lib/supabase');
      const [announcementResult, eventResult, memberResult, galleryResult] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('starts_at', { ascending: true, nullsFirst: false }),
        supabase.from('public_members').select('*').order('sort_order', { ascending: true }).order('display_name', { ascending: true }),
        supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      ]);
      if (announcementResult.error) throw announcementResult.error;
      if (eventResult.error) throw eventResult.error;
      if (memberResult.error) throw memberResult.error;
      if (galleryResult.error) throw galleryResult.error;
      setAnnouncements((announcementResult.data || []) as ContentRow[]);
      setEvents((eventResult.data || []) as ContentRow[]);
      setMembers((memberResult.data || []) as ContentRow[]);
      setGallery((galleryResult.data || []) as ContentRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load website content.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authorized) void loadContent();
  }, [authorized]);

  const rows = activeTab === 'announcements' ? announcements : activeTab === 'events' ? events : activeTab === 'members' ? members : gallery;

  function updateForm<K extends keyof ContentForm>(key: K, value: ContentForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setCurrentStoragePath(null);
  }

  function beginEdit(row: ContentRow) {
    setEditingId(row.id);
    setSelectedFile(null);
    setCurrentStoragePath(row.storage_path || row.avatar_path || null);
    setForm({
      ...emptyForm,
      title: row.title || '',
      body: row.body || '',
      detail: row.detail || '',
      category: row.category || 'Community',
      status: row.status || 'upcoming',
      startsAt: row.starts_at ? new Date(row.starts_at).toISOString().slice(0, 16) : '',
      displayName: row.display_name || '',
      ign: row.ign || '',
      role: row.role || 'Member',
      division: row.division || 'Main',
      bio: row.bio || '',
      avatarUrl: row.avatar_url || '',
      membershipStatus: row.membership_status || 'active',
      featured: Boolean(row.featured),
      caption: row.caption || '',
      altText: row.alt_text || '',
      sortOrder: row.sort_order || 0,
      published: Boolean(row.published),
    });
    setError('');
    setNotice('');
    document.getElementById('content-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError('');
    if (file && !allowedImageTypes.includes(file.type)) {
      setSelectedFile(null);
      setError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file && file.size > maxImageBytes) {
      setSelectedFile(null);
      setError('The image must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
  }

  async function uploadImage(folder: 'members' | 'gallery') {
    if (!selectedFile) return currentStoragePath;
    const { supabase } = await import('./lib/supabase');
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const path = folder + '/' + crypto.randomUUID() + '.' + safeExtension;
    const { data, error: uploadError } = await supabase.storage.from('ruby-gallery').upload(path, selectedFile, {
      cacheControl: '3600', upsert: false, contentType: selectedFile.type,
    });
    if (uploadError) throw uploadError;
    return data.path;
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    let newlyUploadedPath: string | null = null;
    try {
      const { supabase } = await import('./lib/supabase');
      if (activeTab === 'announcements') {
        const payload = { title: form.title.trim(), body: form.body.trim(), category: form.category.trim() || 'Announcement', published: form.published };
        const result = editingId ? await supabase.from('announcements').update(payload).eq('id', editingId) : await supabase.from('announcements').insert(payload);
        if (result.error) throw result.error;
      } else if (activeTab === 'events') {
        const payload = {
          title: form.title.trim(), detail: form.detail.trim(), category: form.category.trim() || 'Community',
          status: form.status, starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          published: form.published,
        };
        const result = editingId ? await supabase.from('events').update(payload).eq('id', editingId) : await supabase.from('events').insert(payload);
        if (result.error) throw result.error;
      } else if (activeTab === 'members') {
        const avatarPath = await uploadImage('members');
        if (avatarPath && selectedFile) newlyUploadedPath = avatarPath;
        const payload: Record<string, unknown> = {
          display_name: form.displayName.trim(), ign: form.ign.trim() || null, role: form.role.trim(),
          category: form.category.trim(), division: form.division.trim(), bio: form.bio.trim(),
          membership_status: form.membershipStatus, featured: form.featured, published: form.published,
          sort_order: form.sortOrder, avatar_url: form.avatarUrl.trim() || null,
        };
        if (avatarPath) payload.avatar_path = avatarPath;
        const result = editingId ? await supabase.from('public_members').update(payload).eq('id', editingId) : await supabase.from('public_members').insert(payload);
        if (result.error) throw result.error;
      } else {
        const storagePath = await uploadImage('gallery');
        if (storagePath && selectedFile) newlyUploadedPath = storagePath;
        if (!storagePath) throw new Error('Choose an image before saving a new gallery item.');
        const payload = {
          storage_path: storagePath, caption: form.caption.trim(), alt_text: form.altText.trim(),
          category: form.category.trim() || 'Community', sort_order: form.sortOrder, published: form.published,
        };
        const result = editingId ? await supabase.from('gallery_items').update(payload).eq('id', editingId) : await supabase.from('gallery_items').insert(payload);
        if (result.error) throw result.error;
      }

      await loadContent();
      const wasEditing = Boolean(editingId);
      resetForm();
      setNotice(wasEditing ? 'Content updated successfully.' : 'Content created successfully.');
    } catch (saveError) {
      if (newlyUploadedPath) {
        try { await removeStorageFile(newlyUploadedPath); } catch { /* Preserve the original save error. */ }
      }
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this content.');
    } finally {
      setSaving(false);
    }
  }

  async function setPublished(row: ContentRow) {
    setError('');
    setNotice('');
    try {
      const { supabase } = await import('./lib/supabase');
      let requestError: { message: string } | null = null;
      if (activeTab === 'announcements') requestError = (await supabase.from('announcements').update({ published: !row.published }).eq('id', row.id)).error;
      else if (activeTab === 'events') requestError = (await supabase.from('events').update({ published: !row.published }).eq('id', row.id)).error;
      else if (activeTab === 'members') requestError = (await supabase.from('public_members').update({ published: !row.published }).eq('id', row.id)).error;
      else requestError = (await supabase.from('gallery_items').update({ published: !row.published }).eq('id', row.id)).error;
      if (requestError) throw new Error(requestError.message);
      await loadContent();
      setNotice(row.published ? 'Content unpublished.' : 'Content published.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to change publication status.');
    }
  }

  async function deleteContent(row: ContentRow) {
    if (!window.confirm('Permanently delete "' + displayTitle(activeTab, row) + '"?')) return;
    setError('');
    setNotice('');
    try {
      const { supabase } = await import('./lib/supabase');
      let requestError: { message: string } | null = null;
      if (activeTab === 'announcements') requestError = (await supabase.from('announcements').delete().eq('id', row.id)).error;
      else if (activeTab === 'events') requestError = (await supabase.from('events').delete().eq('id', row.id)).error;
      else if (activeTab === 'members') requestError = (await supabase.from('public_members').delete().eq('id', row.id)).error;
      else requestError = (await supabase.from('gallery_items').delete().eq('id', row.id)).error;
      if (requestError) throw new Error(requestError.message);

      const storagePath = activeTab === 'gallery' ? row.storage_path : activeTab === 'members' ? row.avatar_path : null;
      let cleanupMessage = '';
      if (storagePath) {
        const { error: storageError } = await supabase.storage.from('ruby-gallery').remove([storagePath]);
        if (storageError) cleanupMessage = ' The stored image could not be removed: ' + storageError.message;
      }
      if (editingId === row.id) resetForm();
      await loadContent();
      setNotice('Content deleted.' + cleanupMessage);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this content.');
    }
  }

  if (checking) {
    return <main className="page section content-admin-page"><p role="status">Checking administrator permissions…</p></main>;
  }

  if (!authorized) {
    return (
      <main className="page section content-admin-page">
        <div className="content-admin-denied">
          <ShieldAlert size={28} />
          <h1>ADMIN ACCESS REQUIRED.</h1>
          <p>This content manager is available only to designated Ruby Essentials administrators.</p>
          <Link to="/login" className="landing-primary">GO TO LOGIN <ArrowUpRight size={16} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page section content-admin-page">
      <div className="content-admin-header">
        <div>
          <p className="eyebrow"><span className="accent">ADMIN / </span>WEBSITE CONTENT</p>
          <h1 className="page-title">CONTENT <span className="accent">CONTROL.</span></h1>
          <p className="muted page-intro">Manage the official news, events, member profiles, and gallery.</p>
        </div>
        <Link to="/admin" className="content-admin-back"><ArrowLeft size={15} /> Membership review</Link>
      </div>

      <nav className="content-admin-tabs" aria-label="Content categories">
        {tabs.map(tab => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => { setActiveTab(tab.id); resetForm(); setError(''); setNotice(''); }}>
            {tab.label}
          </button>
        ))}
      </nav>
      <p className="content-admin-tab-description">{tabs.find(tab => tab.id === activeTab)?.description}</p>
      {notice && <p className="content-admin-notice" role="status"><CheckCircle2 size={16} /> {notice}</p>}
      {error && <p className="content-admin-error" role="alert">{error}</p>}

      <div className="content-admin-layout">
        <section className="content-admin-list-panel">
          <div className="content-admin-panel-heading">
            <div><span className="eyebrow">CURRENT CONTENT</span><h2>{tabs.find(tab => tab.id === activeTab)?.label} <span className="accent">LIBRARY.</span></h2></div>
            <button type="button" className="content-admin-new" onClick={resetForm}><Plus size={15} /> Add new</button>
          </div>
          {loading ? (
            <p className="dynamic-content-state" role="status">Refreshing content…</p>
          ) : rows.length === 0 ? (
            <div className="content-admin-empty"><ImagePlus size={22} /><strong>No items yet</strong><p>Create the first item using the editor.</p></div>
          ) : (
            <div className="content-admin-items">
              {rows.map(row => (
                <article className="content-admin-item" key={row.id}>
                  <div className="content-admin-item-copy">
                    <strong>{displayTitle(activeTab, row)}</strong>
                    <span>{rowDetails(activeTab, row)}</span>
                    <small className={row.published ? 'published' : 'draft'}>{row.published ? 'PUBLISHED' : 'DRAFT / HIDDEN'}</small>
                  </div>
                  <div className="content-admin-item-actions">
                    <button type="button" onClick={() => void setPublished(row)}>{row.published ? 'Unpublish' : 'Publish'}</button>
                    <button type="button" aria-label={'Edit ' + displayTitle(activeTab, row)} onClick={() => beginEdit(row)}><Pencil size={14} /></button>
                    <button type="button" className="delete" aria-label={'Delete ' + displayTitle(activeTab, row)} onClick={() => void deleteContent(row)}><Trash2 size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="content-admin-editor" id="content-editor">
          <div className="content-admin-panel-heading">
            <div><span className="eyebrow">{editingId ? 'EDIT EXISTING' : 'CREATE NEW'}</span><h2>{editingId ? 'UPDATE' : 'ADD'} <span className="accent">{tabs.find(tab => tab.id === activeTab)?.label.toUpperCase()}.</span></h2></div>
            {editingId && <button type="button" className="content-admin-cancel" onClick={resetForm}><X size={15} /> Cancel</button>}
          </div>
          <form onSubmit={saveContent} className="content-admin-form">
            {(activeTab === 'announcements' || activeTab === 'events') && (
              <label>Title<input value={form.title} onChange={event => updateForm('title', event.target.value)} required maxLength={160} /></label>
            )}
            {activeTab === 'announcements' && (
              <label>Announcement body<textarea value={form.body} onChange={event => updateForm('body', event.target.value)} required maxLength={10000} rows={6} /></label>
            )}
            {activeTab === 'events' && (
              <>
                <label>Event details<textarea value={form.detail} onChange={event => updateForm('detail', event.target.value)} required maxLength={2000} rows={4} /></label>
                <label>Start date and time<input type="datetime-local" value={form.startsAt} onChange={event => updateForm('startsAt', event.target.value)} /></label>
                <label>Event status<select value={form.status} onChange={event => updateForm('status', event.target.value)}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
              </>
            )}
            {activeTab === 'members' && (
              <>
                <label>Display name<input value={form.displayName} onChange={event => updateForm('displayName', event.target.value)} required minLength={2} maxLength={80} /></label>
                <label>In-game name<input value={form.ign} onChange={event => updateForm('ign', event.target.value)} maxLength={40} /></label>
                <label>Official role<input value={form.role} onChange={event => updateForm('role', event.target.value)} required maxLength={60} /></label>
                <label>Category / game<input value={form.category} onChange={event => updateForm('category', event.target.value)} required maxLength={40} /></label>
                <label>Division<input value={form.division} onChange={event => updateForm('division', event.target.value)} required maxLength={60} /></label>
                <label>Public biography<textarea value={form.bio} onChange={event => updateForm('bio', event.target.value)} maxLength={500} rows={4} /></label>
                <label>Profile image URL (optional)<input type="url" value={form.avatarUrl} onChange={event => updateForm('avatarUrl', event.target.value)} placeholder="https://…" /></label>
                <label>Membership status<select value={form.membershipStatus} onChange={event => updateForm('membershipStatus', event.target.value as 'active' | 'alumni')}><option value="active">Active</option><option value="alumni">Alumni</option></select></label>
                <label>Display order<input type="number" value={form.sortOrder} onChange={event => updateForm('sortOrder', Number(event.target.value))} /></label>
                <label className="content-admin-check"><input type="checkbox" checked={form.featured} onChange={event => updateForm('featured', event.target.checked)} /> Featured member</label>
              </>
            )}
            {activeTab === 'gallery' && (
              <>
                <label>Photo caption<input value={form.caption} onChange={event => updateForm('caption', event.target.value)} required maxLength={160} /></label>
                <label>Alternative text<input value={form.altText} onChange={event => updateForm('altText', event.target.value)} required maxLength={240} /></label>
                <label>Category<input value={form.category} onChange={event => updateForm('category', event.target.value)} required maxLength={40} /></label>
                <label>Display order<input type="number" value={form.sortOrder} onChange={event => updateForm('sortOrder', Number(event.target.value))} /></label>
              </>
            )}
            {(activeTab === 'announcements' || activeTab === 'events') && (
              <label>Category<input value={form.category} onChange={event => updateForm('category', event.target.value)} required maxLength={40} /></label>
            )}
            {(activeTab === 'members' || activeTab === 'gallery') && (
              <label className="content-admin-upload">
                <span><Upload size={15} /> {activeTab === 'members' ? 'Profile photo (optional)' : 'Gallery image'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                <small>JPG, PNG, or WebP · Maximum 10 MB</small>
              </label>
            )}
            {previewUrl && <div className="content-admin-preview"><img src={previewUrl} alt="Selected upload preview" /><span>{selectedFile?.name}</span></div>}
            <label className="content-admin-check"><input type="checkbox" checked={form.published} onChange={event => updateForm('published', event.target.checked)} /> Publish this item immediately</label>
            <button type="submit" className="content-admin-save" disabled={saving}>
              {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create content'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
