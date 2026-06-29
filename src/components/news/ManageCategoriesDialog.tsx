import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, 
  List, ListItem, ListItemText, IconButton, Box, Alert, CircularProgress, Tooltip, TextField 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { newsApi, type NewsCategory } from '../../api/newsApi';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ManageCategoriesDialogProps {
  open: boolean;
  categories: NewsCategory[];
  onClose: () => void;
  onRefresh: () => void;
}

// Окремий компонент для елемента, який можна перетягувати
const SortableCategoryItem = ({ 
  cat, 
  onDelete, 
  onUpdateName 
}: { 
  cat: NewsCategory; 
  onDelete: (cat: NewsCategory) => void; 
  onUpdateName: (id: string, name: string) => Promise<void>;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(cat.name);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNewName(cat.name);
  }, [cat.name]);

  const handleSave = async () => {
    if (!newName.trim() || newName.trim() === cat.name) {
      setIsEditing(false);
      return;
    }
    try {
      setSubmitting(true);
      await onUpdateName(cat.id, newName.trim());
      setIsEditing(false);
    } catch {
      // Помилка обробляється вище в батьківському компоненті
    } finally {
      setSubmitting(false);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? 'var(--shadow)' : 'none',
    backgroundColor: isDragging ? 'var(--mui-palette-action-hover)' : 'inherit',
  };

  return (
    <ListItem 
      ref={setNodeRef}
      style={style}
      sx={{ 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 1, 
        mb: 1, 
        bgcolor: 'background.paper',
        pr: '90px' // Додатковий відступ для запобігання накладання довгого тексту на екшени
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isEditing ? (
            <>
              <Tooltip title="Зберегти">
                <IconButton size="small" color="success" onClick={handleSave} disabled={submitting}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Скасувати">
                <IconButton size="small" onClick={() => { setIsEditing(false); setNewName(cat.name); }} disabled={submitting}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Редагувати назву">
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Видалити категорію">
                <IconButton edge="end" size="small" color="error" onClick={() => onDelete(cat)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      }
    >
      {/* Вимикаємо drag події під час редагування, щоб уникнути конфліктів виділення тексту */}
      <Box 
        {...(!isEditing ? attributes : {})} 
        {...(!isEditing ? listeners : {})} 
        sx={{ 
          cursor: isEditing ? 'default' : 'grab', 
          mr: 1, 
          display: 'flex', 
          alignItems: 'center',
          opacity: isEditing ? 0.3 : 1,
          '&:active': { cursor: isEditing ? 'default' : 'grabbing' }
        }}
      >
        <DragIndicatorIcon color="action" />
      </Box>
      
      {isEditing ? (
        <TextField
          size="small"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setIsEditing(false); setNewName(cat.name); }
          }}
          disabled={submitting}
          autoFocus
          variant="standard"
          slotProps={{ htmlInput: { style: { padding: '4px 0' } } }}
        />
      ) : (
        <ListItemText primary={cat.name} />
      )}
    </ListItem>
  );
};

export const ManageCategoriesDialog = ({ open, categories, onClose, onRefresh }: ManageCategoriesDialogProps) => {
  const [localCategories, setLocalCategories] = useState<NewsCategory[]>(categories);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<NewsCategory | null>(null);

  // Налаштування сенсорів для підтримки миші, тач-екранів та клавіатури
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      setLocalCategories(categories);
    }
  }, [categories, open]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localCategories.findIndex(c => c.id === active.id);
      const newIndex = localCategories.findIndex(c => c.id === over.id);
      
      const updated = arrayMove(localCategories, oldIndex, newIndex);
      const oldCategories = [...localCategories];
      
      setLocalCategories(updated);

      try {
        setApiError(null);
        await newsApi.reorderCategories(updated.map(c => c.id));
        onRefresh();
      } catch (error: any) {
        setApiError(error.response?.data?.message || 'Помилка збереження порядку');
        setLocalCategories(oldCategories); // Відкат у разі помилки
      }
    }
  };

  const handleUpdateName = async (id: string, name: string) => {
    try {
      setApiError(null);
      await newsApi.updateCategory(id, name);
      onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Не вдалося оновити назву категорії';
      setApiError(msg);
      throw error;
    }
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setApiError(null);
      setLoading(true);
      await newsApi.deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      onRefresh();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити категорію');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Управління категоріями</DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <List sx={{ width: '100%', p: 0 }}>
                {localCategories.map((cat) => (
                  <SortableCategoryItem 
                    key={cat.id} 
                    cat={cat} 
                    onDelete={(cat) => setCategoryToDelete(cat)} 
                    onUpdateName={handleUpdateName} 
                  />
                ))}
              </List>
            </SortableContext>
          </DndContext>
        )}
        
        {!loading && localCategories.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            Категорій не знайдено
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" size="small">
          Закрити
        </Button>
      </DialogActions>

      {/* Модальне вікно підтвердження видалення */}
      <Dialog open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Ви впевнені, що хочете видалити категорію <strong>{categoryToDelete?.name}</strong>? 
            Усі пов'язані новини автоматично залишаться без категорії. Цю дію не можна скасувати.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryToDelete(null)} disabled={loading}>
            Скасувати
          </Button>
          <Button onClick={executeDelete} variant="contained" color="error" disabled={loading}>
            {loading ? 'Видалення...' : 'Видалити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};