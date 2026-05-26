'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Loader2,
  Star,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransportSegments } from '@/presentation/hooks/useTransportSegments';
import { useTransportEditor } from '@/presentation/hooks/useTransportEditor';
import { TransportSegmentForm } from './TransportSegmentForm';
import { TransportOptionForm } from './TransportOptionForm';
import { MODE_ICONS, MODE_COLORS } from './transport-helpers';
import type {
  TransportOption,
  TransportSegment,
  TransportSegmentForm as TSForm,
  TransportOptionForm as TOForm,
} from '@/types/transport.types';
import { cn } from '@/lib/utils/cn';

interface TransportEditorProps {
  routeId: string;
}

// Editor para el creador. Drag-and-drop con @dnd-kit/sortable manteniendo
// accesibilidad por teclado (Space/Enter para tomar, flechas para mover).
export function TransportEditor({ routeId }: TransportEditorProps) {
  const t = useTranslations('howToGetThere');
  const tForm = useTranslations('howToGetThere.form');
  const { segments, isLoading, refetch } = useTransportSegments(routeId);
  const editor = useTransportEditor(routeId);

  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  // Estado para opciones por segmento
  const [addingOptionFor, setAddingOptionFor] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  // Lista local de ids para feedback inmediato del drag — se sincroniza con segments
  // y se reordena optimistamente al soltar; el commit a BD ocurre en paralelo.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Activar drag sólo tras 8px de movimiento para no chocar con clics en botones
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCreateSegment = async (data: TSForm) => {
    const created = await editor.createSegment(data);
    if (created) {
      setIsCreatingSegment(false);
      await refetch();
    }
  };

  const handleUpdateSegment = async (id: string, data: Partial<TSForm>) => {
    const updated = await editor.updateSegment(id, data);
    if (updated) {
      setEditingSegmentId(null);
      await refetch();
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm(t('confirmDeleteSegment'))) return;
    const ok = await editor.deleteSegment(id);
    if (ok) await refetch();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = segments.findIndex((s) => s.id === active.id);
    const newIndex = segments.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(segments, oldIndex, newIndex).map((s) => s.id);
    const ok = await editor.reorderSegments(newOrder);
    if (ok) await refetch();
  };

  const handleAddOption = async (segmentId: string, data: TOForm) => {
    const added = await editor.addOption(segmentId, data);
    if (added) {
      setAddingOptionFor(null);
      await refetch();
    }
  };

  const handleUpdateOption = async (
    optionId: string,
    data: Partial<TOForm>,
  ) => {
    const updated = await editor.updateOption(optionId, data);
    if (updated) {
      setEditingOptionId(null);
      await refetch();
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm(t('confirmDeleteOption'))) return;
    const ok = await editor.deleteOption(optionId);
    if (ok) await refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-6">
        {editor.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600">
            {editor.error}
          </div>
        )}

        {segments.length === 0 && !isCreatingSegment && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t('editorEmpty')}
          </div>
        )}

        {/* Lista de segmentos con drag-and-drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={segments.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {segments.map((segment) => (
                <SortableSegmentRow
                  key={segment.id}
                  segment={segment}
                  isEditing={editingSegmentId === segment.id}
                  isAddingOption={addingOptionFor === segment.id}
                  editingOptionId={editingOptionId}
                  isSaving={editor.isSaving}
                  onEdit={() => setEditingSegmentId(segment.id)}
                  onCancelEdit={() => setEditingSegmentId(null)}
                  onSaveSegment={(data) =>
                    handleUpdateSegment(segment.id, data)
                  }
                  onDelete={() => handleDeleteSegment(segment.id)}
                  onAddOption={() => setAddingOptionFor(segment.id)}
                  onCancelAddOption={() => setAddingOptionFor(null)}
                  onSaveNewOption={(data) => handleAddOption(segment.id, data)}
                  onEditOption={(optionId) => setEditingOptionId(optionId)}
                  onCancelEditOption={() => setEditingOptionId(null)}
                  onSaveOption={(optionId, data) =>
                    handleUpdateOption(optionId, data)
                  }
                  onDeleteOption={(optionId) => handleDeleteOption(optionId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Form de nuevo segmento */}
        {isCreatingSegment ? (
          <TransportSegmentForm
            isSaving={editor.isSaving}
            onSubmit={handleCreateSegment}
            onCancel={() => setIsCreatingSegment(false)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsCreatingSegment(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {tForm('addSegment')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Fila ordenable: header + opciones + form de edición
// =============================================================================

interface SortableSegmentRowProps {
  segment: TransportSegment;
  isEditing: boolean;
  isAddingOption: boolean;
  editingOptionId: string | null;
  isSaving: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveSegment: (data: TSForm) => Promise<void>;
  onDelete: () => void;
  onAddOption: () => void;
  onCancelAddOption: () => void;
  onSaveNewOption: (data: TOForm) => Promise<void>;
  onEditOption: (optionId: string) => void;
  onCancelEditOption: () => void;
  onSaveOption: (optionId: string, data: TOForm) => Promise<void>;
  onDeleteOption: (optionId: string) => void;
}

function SortableSegmentRow({
  segment,
  isEditing,
  isAddingOption,
  editingOptionId,
  isSaving,
  onEdit,
  onCancelEdit,
  onSaveSegment,
  onDelete,
  onAddOption,
  onCancelAddOption,
  onSaveNewOption,
  onEditOption,
  onCancelEditOption,
  onSaveOption,
  onDeleteOption,
}: SortableSegmentRowProps) {
  const t = useTranslations('howToGetThere');
  const tForm = useTranslations('howToGetThere.form');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border rounded-lg p-4 space-y-3 bg-card',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Header del segmento con handle de drag */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Handle de drag — sólo este elemento es arrastrable */}
          <button
            type="button"
            className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label={tForm('dragHandle')}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold shrink-0">
            {segment.order_index}
          </div>
          <div className="min-w-0">
            {segment.title && (
              <p className="font-semibold text-sm">{segment.title}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">
                {segment.from_label}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium text-foreground">
                {segment.to_label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            disabled={isSaving}
            title={tForm('edit')}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isSaving}
            title={tForm('delete')}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form de edición del segmento */}
      {isEditing && (
        <TransportSegmentForm
          initial={segment}
          isSaving={isSaving}
          onSubmit={onSaveSegment}
          onCancel={onCancelEdit}
        />
      )}

      {/* Opciones del segmento */}
      <div className="space-y-2 pl-11">
        {segment.options.map((option) =>
          editingOptionId === option.id ? (
            <TransportOptionForm
              key={option.id}
              initial={option}
              isSaving={isSaving}
              onSubmit={(data) => onSaveOption(option.id, data)}
              onCancel={onCancelEditOption}
            />
          ) : (
            <OptionRow
              key={option.id}
              option={option}
              onEdit={() => onEditOption(option.id)}
              onDelete={() => onDeleteOption(option.id)}
              isSaving={isSaving}
            />
          ),
        )}

        {isAddingOption ? (
          <TransportOptionForm
            isSaving={isSaving}
            onSubmit={onSaveNewOption}
            onCancel={onCancelAddOption}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddOption}
            className="text-muted-foreground"
          >
            <Plus className="h-3 w-3 mr-1" />
            {tForm('addOption')}
          </Button>
        )}
      </div>

      {segment.options.length === 0 && !isAddingOption && (
        <p className="text-xs text-muted-foreground pl-11">
          {t('segmentNoOptions')}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Mini-fila de opción (read-only en el editor; edición abre TransportOptionForm)
// =============================================================================

interface OptionRowProps {
  option: TransportOption;
  onEdit: () => void;
  onDelete: () => void;
  isSaving: boolean;
}

function OptionRow({ option, onEdit, onDelete, isSaving }: OptionRowProps) {
  const t = useTranslations('howToGetThere');
  const tForm = useTranslations('howToGetThere.form');
  const Icon = MODE_ICONS[option.mode];

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-md border bg-background">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            'h-7 w-7 rounded-md border flex items-center justify-center shrink-0',
            MODE_COLORS[option.mode],
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 text-sm">
          <span className="font-medium">{t(`modes.${option.mode}`)}</span>
          {option.operator && (
            <span className="text-muted-foreground">
              {' · '}
              {option.operator}
            </span>
          )}
          {option.is_recommended && (
            <Badge className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border text-[10px] py-0">
              <Star className="h-2.5 w-2.5 mr-1 fill-current" />
              {t('recommended')}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={isSaving}
          title={tForm('edit')}
          className="h-7 w-7"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isSaving}
          title={tForm('delete')}
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
