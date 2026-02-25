'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, apiAuth, apiFormData } from '@/lib/api';
import type { Video, Category, LinkedStudent, User } from '@/types';
import type { PaginatedResponse } from '@/types';
import { VideoCard } from '@/features/videos/VideoCard';
import { VideoPlayer } from '@/features/videos/VideoPlayer';
import { useAuth } from '@/features/auth/AuthProvider';

export default function ProfessionalDashboardPage() {
  const { user, setUser } = useAuth();
  const searchParams = useSearchParams();
  const hasActiveSubscription = user?.has_active_subscription ?? false;

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      apiAuth<User>('me/').then((res) => {
        if (res.success) setUser(res.data!);
      });
      window.history.replaceState({}, '', '/dashboard/professional');
    }
  }, [searchParams, setUser]);

  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCategories, setUploadCategories] = useState<number[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentError, setStudentError] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategories, setEditCategories] = useState<number[]>([]);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatParent, setEditCatParent] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [editCatError, setEditCatError] = useState('');

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deleteCatError, setDeleteCatError] = useState('');

  const loadVideos = async () => {
    const res = await api<PaginatedResponse<Video>>('/videos/me/');
    if (res.success) setVideos(res.data.results ?? []);
  };

  const loadCategories = async () => {
    const res = await api<Category[]>('/categories/');
    if (res.success) setCategories(Array.isArray(res.data) ? res.data : []);
  };

  /** Constrói árvore a partir da lista plana para exibição. */
  function buildCategoryTree(flat: Category[]): Category[] {
    const roots = flat.filter((c) => !c.parent);
    const withChildren = roots.map((root) => ({
      ...root,
      children: flat.filter((c) => c.parent === root.id).map((child) => ({
        ...child,
        children: flat.filter((c) => c.parent === child.id),
      })),
    }));
    return withChildren;
  }

  const loadStudents = async () => {
    if (!hasActiveSubscription) return;
    setStudentsLoading(true);
    const res = await apiAuth<LinkedStudent[]>('students/');
    setStudentsLoading(false);
    if (res.success) setStudents(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    (async () => {
      const catRes = await api<Category[]>('/categories/');
      if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
      if (hasActiveSubscription) {
        const vidRes = await api<PaginatedResponse<Video>>('/videos/me/');
        if (vidRes.success) setVideos(vidRes.data.results ?? []);
      } else {
        setVideos([]);
      }
      setLoading(false);
    })();
  }, [hasActiveSubscription]);

  useEffect(() => {
    loadStudents();
  }, [hasActiveSubscription]);

  async function handleStripeCheckout() {
    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      const res = await apiAuth<{ checkout_url?: string; url?: string }>('stripe/checkout/', { method: 'POST' });
      if (res.success && res.data) {
        const url = res.data.checkout_url ?? (res.data as { url?: string }).url;
        if (url) {
          window.location.href = url;
          return;
        }
      }
      setCheckoutError(res.success ? 'Não foi possível obter o link de pagamento.' : (res.error?.message ?? 'Erro ao iniciar pagamento. Tente de novo.'));
    } catch (e) {
      setCheckoutError('Erro de conexão. Verifique a internet e tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    const email = studentEmail.trim().toLowerCase();
    if (!email) {
      setStudentError('Informe o e-mail do aluno.');
      return;
    }
    setAddingStudent(true);
    const res = await apiAuth<LinkedStudent>('students/', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    });
    setAddingStudent(false);
    if (res.success) {
      setStudents((s) => [res.data!, ...s]);
      setStudentEmail('');
    } else {
      setStudentError(res.error.message);
    }
  }

  async function handleRemoveStudent(id: number) {
    const res = await apiAuth<unknown>(`students/${id}/`, { method: 'DELETE' });
    if (res.success) setStudents((s) => s.filter((x) => x.id !== id));
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError('');
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Informe o nome da categoria.');
      return;
    }
    setAddingCategory(true);
    const res = await api<Category>('/categories/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: newCategoryDesc.trim() || undefined,
        parent: newCategoryParent ? Number(newCategoryParent) : null,
      }),
    });
    setAddingCategory(false);
    if (res.success && res.data) {
      setCategories((c) => [...c, res.data!].sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name)));
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryParent('');
    } else {
      setCategoryError(res.error?.message ?? 'Erro ao criar categoria.');
    }
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description ?? '');
    setEditCatParent(cat.parent ? String(cat.parent) : '');
    setEditCatError('');
  }

  async function handleSaveCategoryEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    setEditCatError('');
    setSavingCategory(true);
    const res = await api<Category>(`/categories/${editingCategory.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editCatName.trim(),
        description: editCatDesc.trim() || undefined,
        parent: editCatParent ? Number(editCatParent) : null,
      }),
    });
    setSavingCategory(false);
    if (res.success && res.data) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? res.data! : c))
      );
      setEditingCategory(null);
    } else {
      setEditCatError(res.error?.message ?? 'Erro ao salvar.');
    }
  }

  async function handleConfirmDeleteCategory() {
    if (!categoryToDelete) return;
    setDeleteCatError('');
    setDeletingCategory(true);
    const res = await api<null>(`/categories/${categoryToDelete.id}/`, { method: 'DELETE' });
    setDeletingCategory(false);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } else {
      setDeleteCatError(res.error?.message ?? 'Não foi possível excluir.');
    }
  }

  function openEditModal(video: Video) {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDesc(video.description ?? '');
    setEditCategories(video.categories?.map((c) => c.id) ?? []);
    setEditError('');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVideo) return;
    setEditError('');
    setSavingEdit(true);
    const res = await api<Video>(`/videos/${editingVideo.id}/edit/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDesc.trim(),
        categories: editCategories,
      }),
    });
    setSavingEdit(false);
    if (res.success && res.data) {
      setVideos((prev) => prev.map((v) => (v.id === editingVideo.id ? res.data! : v)));
      setEditingVideo(null);
    } else {
      setEditError(res.error?.message ?? 'Erro ao salvar.');
    }
  }

  async function handleConfirmDelete() {
    if (!videoToDelete) return;
    setDeleteError('');
    setDeleting(true);
    const res = await api<null>(`/videos/${videoToDelete.id}/edit/`, { method: 'DELETE' });
    setDeleting(false);
    if (res.success) {
      setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      if (selectedVideo?.id === videoToDelete.id) setSelectedVideo(null);
      setVideoToDelete(null);
    } else {
      setDeleteError(res.error?.message ?? 'Não foi possível excluir.');
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError('');
    setUploading(true);
    if (uploadFile) {
      const form = new FormData();
      form.append('title', uploadTitle);
      form.append('description', uploadDesc);
      form.append('video_file', uploadFile);
      uploadCategories.forEach((id) => form.append('categories', String(id)));
      const res = await apiFormData<Video>('/videos/upload/', form);
      if (res.success) {
        setVideos((v) => [res.data!, ...v]);
        setUploadOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadCategories([]);
        setUploadFile(null);
      } else {
        setUploadError(res.error!.message);
      }
    } else if (uploadUrl.trim()) {
      const res = await api<Video>('/videos/upload/', {
        method: 'POST',
        body: JSON.stringify({
          title: uploadTitle,
          description: uploadDesc,
          video_url: uploadUrl,
          categories: uploadCategories,
        }),
      });
      if (res.success) {
        setVideos((v) => [res.data!, ...v]);
        setUploadOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadUrl('');
        setUploadCategories([]);
        setUploadError('');
      } else {
        setUploadError(res.error!.message);
      }
    } else {
      setUploadError('Informe a URL do vídeo ou envie um arquivo.');
    }
    setUploading(false);
  }

  return (
    <div>
      {/* Acesso (pagamento único) */}
      <div className="card p-4 sm:p-5 mb-6">
        {hasActiveSubscription ? (
          <p className="text-white/90 font-medium">Acesso ativo — você pode enviar vídeos e gerenciar alunos.</p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-white/90">
              Pague R$ 39,70 uma vez para acessar o sistema e enviar vídeos para os alunos que você vincular.
            </p>
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={checkoutLoading}
              className="btn-primary text-sm w-full sm:w-auto"
            >
              {checkoutLoading ? 'Redirecionando...' : 'Pagar R$ 39,70'}
            </button>
          </div>
          {checkoutError && <p className="text-red-400 text-sm mt-2">{checkoutError}</p>}
        )}
      </div>

      {/* Meus alunos (só com assinatura ativa) */}
      {hasActiveSubscription && (
        <div className="card p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Meus alunos</h2>
          <p className="text-white/60 text-sm mb-4">
            Apenas os alunos listados abaixo podem ver seus vídeos no app.
          </p>
          <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="email"
              placeholder="E-mail do aluno"
              className="input-field flex-1"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={addingStudent}>
              {addingStudent ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
          {studentError && <p className="text-red-400 text-sm mb-2">{studentError}</p>}
          {studentsLoading ? (
            <p className="text-white/60 text-sm">Carregando...</p>
          ) : students.length === 0 ? (
            <p className="text-white/60 text-sm">Nenhum aluno vinculado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-white/10 last:border-0"
                >
                  <span className="text-sm">
                    {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.email}
                    <span className="text-white/50 ml-1">({s.email})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(s.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasActiveSubscription && (
        <div className="card p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Categorias</h2>
          <p className="text-white/60 text-sm mb-4">
            Crie categorias e subcategorias para organizar seus vídeos. Edite ou exclua quando quiser.
          </p>
          <form onSubmit={handleAddCategory} className="space-y-2 mb-4 max-w-md">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome da categoria ou subcategoria *"
                className="input-field flex-1"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={addingCategory}>
                {addingCategory ? 'Criando...' : 'Criar'}
              </button>
            </div>
            <select
              className="input-field w-full"
              value={newCategoryParent}
              onChange={(e) => setNewCategoryParent(e.target.value)}
            >
              <option value="">Nenhum (categoria raiz)</option>
              {categories.filter((c) => !c.parent).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name || c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Descrição (opcional)"
              className="input-field w-full"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
            />
          </form>
          {categoryError && <p className="text-red-400 text-sm mb-2">{categoryError}</p>}
          {categories.length > 0 && (
            <ul className="space-y-1 mt-4">
              {buildCategoryTree(categories).map((root) => (
                <li key={root.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-white/5">
                    <span className="font-medium">{root.name}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditCategory(root)} className="text-brand-orange hover:underline text-sm">
                        Editar
                      </button>
                      <button type="button" onClick={() => setCategoryToDelete(root)} className="text-red-400 hover:underline text-sm">
                        Excluir
                      </button>
                    </div>
                  </div>
                  {(root.children ?? []).length > 0 && (
                    <ul className="pl-4 space-y-1">
                      {(root.children ?? []).map((child: Category) => (
                        <li key={child.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-white/5">
                          <span className="text-white/90">{child.name}</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => openEditCategory(child)} className="text-brand-orange hover:underline text-sm">
                              Editar
                            </button>
                            <button type="button" onClick={() => setCategoryToDelete(child)} className="text-red-400 hover:underline text-sm">
                              Excluir
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Meus vídeos</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard" className="btn-secondary text-sm text-center sm:text-left">
            Ver todos os treinos
          </Link>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="btn-primary text-sm"
            disabled={!hasActiveSubscription}
            title={!hasActiveSubscription ? 'Assine para enviar vídeos' : undefined}
          >
            Novo vídeo
          </button>
        </div>
      </div>

      {uploadOpen && (
        <div className="card p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Enviar vídeo</h2>
          <form onSubmit={handleUpload} className="space-y-4 w-full max-w-md">
            <input
              type="text"
              placeholder="Título *"
              className="input-field"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Descrição"
              className="input-field min-h-[80px]"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
            />
            <input
              type="url"
              placeholder="URL do vídeo (ou envie arquivo abaixo)"
              className="input-field"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
            />
            <div>
              <label className="block text-sm text-white/70 mb-1">Arquivo de vídeo (opcional)</label>
              <input
                type="file"
                accept="video/*"
                className="input-field"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Categorias (pode escolher várias)</label>
              <select
                multiple
                className="input-field w-full min-h-[100px]"
                value={uploadCategories.map(String)}
                onChange={(e) => {
                  const sel = e.target;
                  setUploadCategories(Array.from(sel.selectedOptions).map((o) => Number(o.value)));
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.name}
                  </option>
                ))}
              </select>
              <p className="text-white/50 text-xs mt-1">Segure Ctrl (ou Cmd no Mac) para selecionar mais de uma.</p>
            </div>
            {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  setUploadError('');
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {editingVideo && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70">
          <div className="card max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar vídeo</h2>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <label className="text-sm text-white/80">Título</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input-field"
                required
              />
              <label className="text-sm text-white/80">Descrição</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input-field min-h-[80px]"
                rows={3}
              />
              <label className="text-sm text-white/80">Categorias (pode escolher várias)</label>
              <select
                multiple
                className="input-field min-h-[100px]"
                value={editCategories.map(String)}
                onChange={(e) => {
                  const sel = e.target;
                  setEditCategories(Array.from(sel.selectedOptions).map((o) => Number(o.value)));
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.name}
                  </option>
                ))}
              </select>
              <p className="text-white/50 text-xs mt-1">Segure Ctrl (ou Cmd) para múltipla seleção.</p>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingEdit}>
                  {savingEdit ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditingVideo(null)} className="btn-secondary w-full sm:w-auto">
                  Cancelar
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (editingVideo) {
                      setVideoToDelete(editingVideo);
                      setEditingVideo(null);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Excluir vídeo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {videoToDelete && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70">
          <div className="card max-w-sm w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-2">Excluir vídeo</h2>
            <p className="text-white/80 text-sm mb-4">
              Tem certeza que deseja excluir &quot;{videoToDelete.title}&quot;? Esta ação não pode ser desfeita.
            </p>
            {deleteError && <p className="text-red-400 text-sm mb-2">{deleteError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="btn-primary bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
              <button
                type="button"
                onClick={() => { setVideoToDelete(null); setDeleteError(''); }}
                disabled={deleting}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70">
          <div className="card max-w-lg w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Editar categoria</h2>
            <form onSubmit={handleSaveCategoryEdit} className="space-y-3">
              <label className="block text-sm text-white/80">Nome</label>
              <input
                type="text"
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
                className="input-field w-full"
                required
              />
              <label className="block text-sm text-white/80">Descrição</label>
              <input
                type="text"
                value={editCatDesc}
                onChange={(e) => setEditCatDesc(e.target.value)}
                className="input-field w-full"
              />
              <label className="block text-sm text-white/80">Categoria pai</label>
              <select
                value={editCatParent}
                onChange={(e) => setEditCatParent(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Nenhum (raiz)</option>
                {categories.filter((c) => !c.parent && c.id !== editingCategory.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {editCatError && <p className="text-red-400 text-sm">{editCatError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary" disabled={savingCategory}>
                  {savingCategory ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditingCategory(null)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70">
          <div className="card max-w-sm w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-2">Excluir categoria</h2>
            <p className="text-white/80 text-sm mb-4">
              Excluir &quot;{categoryToDelete.display_name || categoryToDelete.name}&quot;? Subcategorias também serão excluídas. Vídeos desta categoria ficarão sem categoria.
            </p>
            {deleteCatError && <p className="text-red-400 text-sm mb-2">{deleteCatError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={deletingCategory}
                className="btn-primary bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {deletingCategory ? 'Excluindo...' : 'Excluir'}
              </button>
              <button
                type="button"
                onClick={() => { setCategoryToDelete(null); setDeleteCatError(''); }}
                disabled={deletingCategory}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVideo ? (
        <div className="mb-6">
          <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
        </div>
      ) : null}

      {loading ? (
        <p className="text-white/60 py-4">Carregando...</p>
      ) : !hasActiveSubscription ? (
        <p className="text-white/60 py-4">Pague R$ 39,70 para enviar e gerenciar seus vídeos.</p>
      ) : videos.length === 0 ? (
        <p className="text-white/60 py-4">Você ainda não enviou nenhum vídeo.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onClick={() => setSelectedVideo(v)}
              onEdit={() => openEditModal(v)}
              onDelete={() => setVideoToDelete(v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
