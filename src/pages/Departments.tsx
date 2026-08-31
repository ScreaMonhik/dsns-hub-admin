import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Box, Typography, Button, Paper, CircularProgress,
  IconButton, Tooltip, List, ListItem, ListItemText, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import { departmentsApi, type Department } from '../api/departmentsApi';
import { DepartmentFormDialog } from '../components/departments/DepartmentFormDialog';
import { DeleteDepartmentDialog } from '../components/departments/DeleteDepartmentDialog';
import { PermissionGuard } from '../components/common/PermissionGuard';

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

type FlattenedDepartment = Department & { depth: number; computedHasChildren: boolean };

// Допоміжна функція для перетворення плоского масиву в дерево і назад у плоский масив з відступами (depth)
const buildFlattenedTree = (
  items: Department[], 
  expandedIds: Set<string>,
  parentId: string | null = null, 
  depth: number = 0
): FlattenedDepartment[] => {
  const children = items.filter(item => item.parentId === parentId).sort((a, b) => a.orderIndex - b.orderIndex);
  return children.reduce((acc, curr) => {
    // Динамічно перевіряємо, чи є у цього елемента діти в локальному масиві, щоб уникнути багів зі зникненням елементів
    const computedHasChildren = items.some(item => item.parentId === curr.id);
    const itemWithDepth = { ...curr, depth, computedHasChildren };
    let descendants: FlattenedDepartment[] = [];
    
    if (expandedIds.has(curr.id) && computedHasChildren) {
      descendants = buildFlattenedTree(items, expandedIds, curr.id, depth + 1);
    }
    
    return [...acc, itemWithDepth, ...descendants];
  }, [] as FlattenedDepartment[]);
};

const SortableDepartmentItem = ({ 
  department, 
  depth, 
  isExpanded,
  onToggleExpand,
  onEdit, 
  onDelete 
}: { 
  department: FlattenedDepartment; 
  depth: number; 
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (d: Department) => void; 
  onDelete: (d: Department) => void; 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: department.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.8 : 1,
    backgroundColor: isDragging ? 'var(--mui-palette-action-hover)' : 'inherit',
    borderBottom: '1px solid var(--mui-palette-divider)',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
  };

  const depthIndicators = Array.from({ length: depth }).map((_, index) => (
    <Box 
      key={index} 
      sx={{ 
        width: 32, 
        height: '100%', 
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: -10,
          bottom: -10,
          width: '1px',
          bgcolor: 'divider'
        }
      }} 
    />
  ));

  return (
    <ListItem 
      ref={setNodeRef} 
      style={style} 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'background.paper',
        py: 1.5,
        px: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box 
        {...attributes} 
        {...listeners} 
        sx={{ 
          cursor: 'grab', 
          display: 'flex', 
          alignItems: 'center', 
          mr: 1, 
          color: 'text.disabled',
          '&:active': { cursor: 'grabbing', color: 'primary.main' },
          '&:hover': { color: 'action.active' },
          p: 0.5
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      <Box sx={{ display: 'flex', alignSelf: 'stretch' }}>
        {depthIndicators}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 32, mr: 1 }}>
        {department.computedHasChildren ? (
          <IconButton 
            size="small" 
            onClick={() => onToggleExpand(department.id)}
            sx={{ bgcolor: 'action.hover' }}
          >
            {isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        ) : depth > 0 ? (
          <SubdirectoryArrowRightIcon fontSize="small" color="disabled" sx={{ ml: 1 }} />
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: department.computedHasChildren ? 'primary.main' : 'text.secondary' }}>
        {department.computedHasChildren ? (
          isExpanded ? <FolderOpenIcon /> : <FolderIcon />
        ) : (
          <Box sx={{ width: 24 }} /> 
        )}
      </Box>

      <ListItemText 
        primary={department.name} 
        secondary={department.computedHasChildren ? 'Має вкладені підрозділи' : undefined} 
        slotProps={{
          primary: { 
            sx: { 
              fontWeight: depth === 0 ? 600 : 400,
              color: depth === 0 ? 'text.primary' : 'text.secondary'
            } 
          }
        }}
      />
      
      <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
        <Tooltip title="Редагувати">
          <IconButton size="small" color="primary" onClick={() => onEdit(department)} sx={{ bgcolor: 'action.hover' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Видалити">
          <IconButton size="small" color="error" onClick={() => onDelete(department)} sx={{ bgcolor: 'error.lighter' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </ListItem>
  );
};

export const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const result = await departmentsApi.getAllDepartments();
      setDepartments(result);
    } catch (error) {
      console.error('Failed to fetch all departments', error);
      setApiError('Не вдалося завантажити структуру підрозділів.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const flattenedTree = useMemo(() => buildFlattenedTree(departments, expandedIds), [departments, expandedIds]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 1. Захист від переміщення папки всередину самої себе (або своїх дочірніх)
    const isDescendant = (childId: string, targetParentId: string) => {
      let current = departments.find(d => d.id === childId);
      while (current?.parentId) {
        if (current.parentId === targetParentId) return true;
        current = departments.find(d => d.id === current?.parentId);
      }
      return false;
    };
    if (isDescendant(overId, activeId)) return;

    const oldIndex = flattenedTree.findIndex(d => d.id === activeId);
    const newIndex = flattenedTree.findIndex(d => d.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // 2. Розрахунок нового рівня вкладеності на основі горизонтального зміщення
    // Робимо drag-and-drop більш чутливим, щоб простіше було зробити підрозділ дочірнім (20px замість 32px)
    const depthDelta = Math.round(delta.x / 20);
    let projectedDepth = flattenedTree[oldIndex].depth + depthDelta;

    const reorderedTree = arrayMove(flattenedTree, oldIndex, newIndex);
    const prevItem = newIndex > 0 ? reorderedTree[newIndex - 1] : null;

    // 3. Обмеження рівня вкладеності (не глибше ніж +1 від попереднього елемента)
    const maxDepth = prevItem ? prevItem.depth + 1 : 0;
    if (projectedDepth > maxDepth) projectedDepth = maxDepth;
    if (projectedDepth < 0) projectedDepth = 0;

    // 4. Пошук нового батьківського підрозділу на основі розрахованого рівня
    let newParentId: string | null = null;
    if (projectedDepth > 0 && prevItem) {
      for (let i = newIndex - 1; i >= 0; i--) {
        if (reorderedTree[i].depth === projectedDepth - 1) {
          newParentId = reorderedTree[i].id;
          break;
        }
      }
    }

    // 5. Формування нового порядку елементів для цільового батька
    const updatedDepartments = departments.map(d => 
      d.id === activeId ? { ...d, parentId: newParentId } : d
    );

    const newSiblings = updatedDepartments
      .filter(d => d.parentId === newParentId && d.id !== activeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    let insertionIndex = newSiblings.length;
    if (prevItem && prevItem.parentId === newParentId) {
      const prevSiblingIndex = newSiblings.findIndex(d => d.id === prevItem.id);
      if (prevSiblingIndex !== -1) insertionIndex = prevSiblingIndex + 1;
    } else if (prevItem && prevItem.id === newParentId) {
      insertionIndex = 0;
    }

    // Вставляємо переміщений елемент у правильне місце серед братів/сестер
    newSiblings.splice(insertionIndex, 0, updatedDepartments.find(d => d.id === activeId)!);

    // 6. Формування Payload для API (Оновлюємо тільки змінені сутності)
    const updates: { id: string; parentId: string | null; orderIndex: number }[] = [];
    
    newSiblings.forEach((item, index) => {
      updates.push({ id: item.id, parentId: newParentId, orderIndex: index });
    });

    const oldParentId = departments.find(d => d.id === activeId)?.parentId || null;
    if (oldParentId !== newParentId) {
      const oldSiblings = updatedDepartments
        .filter(d => d.parentId === oldParentId && d.id !== activeId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
        
      oldSiblings.forEach((item, index) => {
        updates.push({ id: item.id, parentId: oldParentId, orderIndex: index });
      });
    }

    const finalUpdates = updates.filter(u => {
      const orig = departments.find(d => d.id === u.id);
      return orig && (orig.parentId !== u.parentId || orig.orderIndex !== u.orderIndex);
    });

    if (finalUpdates.length === 0) return;

    try {
      setSavingOrder(true);
      
      // Оптимістичне оновлення UI + Автоматичне розгортання нової папки
      setDepartments(prev => prev.map(d => {
        const u = finalUpdates.find(upd => upd.id === d.id);
        return u ? { ...d, parentId: u.parentId, orderIndex: u.orderIndex } : d;
      }));
      
      if (newParentId) {
        setExpandedIds(prev => new Set(prev).add(newParentId!));
      }

      await departmentsApi.reorderDepartments(finalUpdates);
    } catch (error) {
      console.error('Failed to reorder', error);
      setApiError('Помилка збереження структури підрозділів.');
      fetchDepartments(); // Відкат у разі помилки
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <PermissionGuard require="SUPER_ADMIN" redirectTo="/">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Структура підрозділів</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {savingOrder && <CircularProgress size={20} />}
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => { setEditDepartment(null); setIsFormOpen(true); }}
            >
              Створити підрозділ
            </Button>
          </Box>
        </Box>

        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

        <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : flattenedTree.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              Жодного підрозділу не знайдено. Створіть перший кореневий підрозділ.
            </Box>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={flattenedTree.map(d => d.id)} strategy={verticalListSortingStrategy}>
                <List sx={{ p: 0, width: '100%' }}>
                  {flattenedTree.map((item) => (
                    <SortableDepartmentItem
                      key={item.id}
                      department={item}
                      depth={item.depth}
                      isExpanded={expandedIds.has(item.id)}
                      onToggleExpand={toggleExpand}
                      onEdit={(d) => { setEditDepartment(d); setIsFormOpen(true); }}
                      onDelete={(d) => setDeleteDepartment(d)}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          )}
        </Paper>

        <DepartmentFormDialog 
          open={isFormOpen} 
          department={editDepartment} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchDepartments} 
        />

        <DeleteDepartmentDialog 
          open={!!deleteDepartment} 
          department={deleteDepartment} 
          onClose={() => setDeleteDepartment(null)} 
          onSuccess={fetchDepartments} 
        />
      </Box>
    </PermissionGuard>
  );
};

