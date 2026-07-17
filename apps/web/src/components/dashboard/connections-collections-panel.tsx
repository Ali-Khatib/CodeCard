'use client';

import { useCallback, useState, useTransition } from 'react';
import {
  createCollectionAction,
  deleteCollectionAction,
  updateCollectionAction,
} from '@/app/actions/collections';
import type { OwnerCollection } from '@/lib/connections/collections-core';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import { FadeInView } from '@/components/dashboard/fade-in-view';

export function ConnectionsCollectionsPanel({
  initialCollections,
  onCollectionsChange,
}: {
  initialCollections: OwnerCollection[];
  onCollectionsChange?: (collections: OwnerCollection[]) => void;
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const publish = useCallback(
    (next: OwnerCollection[]) => {
      setCollections(next);
      onCollectionsChange?.(next);
    },
    [onCollectionsChange],
  );

  const onCreate = () => {
    if (pending) return;
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const result = await createCollectionAction({
        name,
        description: description || null,
      });
      if (!result.success || !result.collection) {
        setError(result.error ?? 'Could not create collection.');
        return;
      }
      publish([...collections, result.collection]);
      setName('');
      setDescription('');
      setCreating(false);
      setStatus(`Created “${result.collection.name}”.`);
    });
  };

  const onRename = (collectionId: string) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await updateCollectionAction({ collectionId, name: editName });
      if (!result.success || !result.collection) {
        setError(result.error ?? 'Could not rename collection.');
        return;
      }
      publish(collections.map((c) => (c.id === collectionId ? result.collection! : c)));
      setEditingId(null);
      setStatus(`Renamed to “${result.collection.name}”.`);
    });
  };

  const onDelete = (collection: OwnerCollection) => {
    if (pending) return;
    const confirmed = window.confirm(
      `Delete “${collection.name}”? Your saved Connections stay connected — only this collection is removed.`,
    );
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCollectionAction({ collectionId: collection.id });
      if (!result.success) {
        setError(result.error ?? 'Could not delete collection.');
        return;
      }
      publish(collections.filter((c) => c.id !== collection.id));
      setStatus(`Deleted “${collection.name}”. Saved people remain in Connections.`);
    });
  };

  return (
    <FadeInView delay={0.04}>
      <section
        className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5 md:p-6"
        aria-labelledby="connections-collections-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="connections-collections-heading"
              className="text-[18px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
            >
              Collections
            </h2>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--app-smoke)]">
              Private folders for organizing people you saved. Only you can see them.
            </p>
          </div>
          {!creating ? (
            <AppButton
              variant="primary"
              onClick={() => {
                setCreating(true);
                setError(null);
              }}
            >
              Create collection
            </AppButton>
          ) : null}
        </div>

        {creating ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onCreate();
            }}
          >
            <div>
              <label htmlFor="collection-name" className="mb-1 block text-[13px] text-[var(--app-smoke)]">
                Collection name
              </label>
              <input
                id="collection-name"
                className="cc-app-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                autoFocus
                aria-required="true"
              />
            </div>
            <div>
              <label
                htmlFor="collection-description"
                className="mb-1 block text-[13px] text-[var(--app-smoke)]"
              >
                Description (optional)
              </label>
              <input
                id="collection-description"
                className="cc-app-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton variant="primary" type="submit" ariaLabel="Save collection">
                {pending ? 'Saving…' : 'Save collection'}
              </AppButton>
              <AppButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreating(false);
                  setName('');
                  setDescription('');
                }}
              >
                Cancel
              </AppButton>
            </div>
          </form>
        ) : null}

        {collections.length === 0 && !creating ? (
          <p className="mt-5 text-[14px] text-[var(--app-smoke)]">
            No collections yet. Create one like “Recruiters” or “Conference contacts” to organize
            your network.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {collections.map((collection) => (
              <li
                key={collection.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--app-border)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {editingId === collection.id ? (
                    <form
                      className="flex flex-wrap gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRename(collection.id);
                      }}
                    >
                      <label className="sr-only" htmlFor={`rename-${collection.id}`}>
                        Rename collection
                      </label>
                      <input
                        id={`rename-${collection.id}`}
                        className="cc-app-input max-w-xs"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={80}
                        required
                      />
                      <AppButton variant="primary" type="submit">
                        Save
                      </AppButton>
                      <AppButton variant="ghost" type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </AppButton>
                    </form>
                  ) : (
                    <>
                      <p className="truncate text-[15px] font-medium text-[var(--app-ink)]">
                        {collection.name}
                      </p>
                      <p className="text-[13px] text-[var(--app-smoke)]">
                        {collection.connectionCount}{' '}
                        {collection.connectionCount === 1 ? 'Connection' : 'Connections'}
                      </p>
                    </>
                  )}
                </div>
                {editingId !== collection.id ? (
                  <div className="flex flex-wrap gap-2">
                    <AppButton
                      variant="ghost"
                      onClick={() => {
                        setEditingId(collection.id);
                        setEditName(collection.name);
                      }}
                      ariaLabel={`Rename ${collection.name}`}
                    >
                      Rename
                    </AppButton>
                    <AppButton
                      variant="ghost"
                      onClick={() => onDelete(collection)}
                      ariaLabel={`Delete ${collection.name} collection`}
                    >
                      Delete
                    </AppButton>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {pending ? 'Updating collections' : status ?? ''}
        </p>
        {status && !pending ? (
          <p className="mt-3 text-[13px] text-[var(--app-smoke)]" aria-live="polite">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </FadeInView>
  );
}
