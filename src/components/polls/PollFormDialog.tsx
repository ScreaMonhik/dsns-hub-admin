import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Alert, MenuItem, IconButton, Typography, Select, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { pollsApi, PollStatus, type Poll, type PollDepartment } from '../../api/pollsApi';

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const pollSchema = z.object({
  title: z.string().min(3, 'Мінімум 3 символи'),
  description: z.string().optional(),
  departmentIds: z.array(z.string()),
  options: z.array(
    z.object({ text: z.string().min(1, "Обов'язкове поле") })
  ).min(2, 'Мінімум 2 варіанти відповіді'),
});

type FormInputs = z.infer<typeof pollSchema>;

const SortableOptionItem = ({
  item,
  index,
  control,
  errors,
  remove,
  disabledDelete
}: {
  item: { id: string; text: string };
  index: number;
  control: Control<FormInputs>;
  errors: FieldErrors<FormInputs>;
  remove: (index: number) => void;
  disabledDelete: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform), // Використовуємо чисто переміщення без деформації матриці
    transition,
    zIndex: isDragging ? 100 : 1, // Піднімаємо картку під час перетягування над іншими елементами
    opacity: isDragging ? 0.6 : 1,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'var(--mui-palette-background-paper)',
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Box 
        {...attributes} 
        {...listeners} 
        sx={{ 
          cursor: isDragging ? 'grabbing' : 'grab', 
          display: 'flex', 
          alignItems: 'center',
          pr: 0.5,
          '&:active': { cursor: 'grabbing' }
        }}
      >
        <DragIndicatorIcon color="action" />
      </Box>
      <Controller
        name={`options.${index}.text` as const}
        control={control}
        render={({ field }) => (
          <TextField 
            {...field} 
            size="small" 
            fullWidth 
            placeholder={`Варіант ${index + 1}`} 
            error={!!errors.options?.[index]?.text} 
            helperText={errors.options?.[index]?.text?.message} 
          />
        )}
      />
      <IconButton color="error" onClick={() => remove(index)} disabled={disabledDelete}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

interface Props {
  open: boolean;
  poll: Poll | null;
  departments: PollDepartment[];
  onClose: () => void;
  onSuccess: () => void;
  isDuplicate?: boolean; // Новий необов'язковий проп для режиму клонування
}

export const PollFormDialog = ({ open, poll, departments, onClose, onSuccess, isDuplicate }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(pollSchema),
    defaultValues: { title: '', description: '', departmentIds: [], options: [{ text: '' }, { text: '' }] },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "options" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  useEffect(() => {
    if (open) {
      if (poll) {
        reset({
          title: isDuplicate ? `${poll.title} (Копія)` : poll.title,
          description: poll.description || '',
          departmentIds: poll.departments?.map(d => d.id) || [],
          options: poll.options?.map(o => ({ text: o.text })) || [{ text: '' }, { text: '' }],
        });
      } else {
        reset({ title: '', description: '', departmentIds: [], options: [{ text: '' }, { text: '' }] });
      }
    }
  }, [open, poll, reset, isDuplicate]);

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      const payload = {
        title: data.title,
        description: data.description,
        departmentIds: data.departmentIds,
        options: data.options.map(o => o.text),
        status: PollStatus.DRAFT, 
      };

      console.log('DEBUG: Передаємо на бекенд у такому порядку:', payload.options);

      // Якщо ми в режимі дублювання, ігноруємо poll.id і викликаємо метод створення нового запису
      if (poll && !isDuplicate) {
        await pollsApi.updatePoll(poll.id, payload);
      } else {
        await pollsApi.createPoll(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося зберегти опитування');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isDuplicate 
          ? 'Дублювати опитування (Нова чернетка)' 
          : poll 
            ? 'Редагувати опитування (Чернетка)' 
            : 'Створити опитування'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}
          {poll && poll.status !== PollStatus.DRAFT && (
            <Alert severity="warning">Увага: Редагування дозволено тільки для чернеток. Запит може бути відхилено бекендом.</Alert>
          )}
          
          <Controller name="title" control={control} render={({ field }) => (
            <TextField {...field} label="Запитання (Заголовок)" error={!!errors.title} helperText={errors.title?.message} fullWidth autoFocus />
          )}/>

          <Controller name="description" control={control} render={({ field }) => (
            <TextField {...field} label="Опис (необов'язково)" multiline rows={2} fullWidth />
          )}/>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Прив'язка до підрозділів</Typography>
            <Controller name="departmentIds" control={control} render={({ field }) => (
              <Select
                {...field}
                multiple
                fullWidth
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) return <em>Всі підрозділи (Загальнонаціональне)</em>;
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((val) => (
                        <Chip key={val} label={departments.find(d => d.id === val)?.name || val} size="small" />
                      ))}
                    </Box>
                  );
                }}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            )}/>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Варіанти відповіді</Typography>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {fields.map((item, index) => (
                  <SortableOptionItem
                    key={item.id}
                    item={item}
                    index={index}
                    control={control}
                    errors={errors}
                    remove={remove}
                    disabledDelete={fields.length <= 2}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {errors.options && <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>{errors.options.root?.message}</Typography>}
            <Button startIcon={<AddIcon />} onClick={() => append({ text: '' })} sx={{ mt: 1 }}>
              Додати варіант
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : 'Зберегти (як Чернетку)'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};