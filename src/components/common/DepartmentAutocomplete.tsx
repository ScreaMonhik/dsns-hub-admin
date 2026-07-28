import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, type AutocompleteProps } from '@mui/material';
import { departmentsApi, type Department } from '../../api/departmentsApi';

interface DepartmentAutocompleteProps<Multiple extends boolean | undefined = false> 
  extends Omit<AutocompleteProps<Department, Multiple, false, false>, 'options' | 'renderInput' | 'loading'> {
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: React.ReactNode;
}

export function DepartmentAutocomplete<Multiple extends boolean | undefined = false>({
  label,
  placeholder = "Почніть вводити назву...",
  error,
  helperText,
  multiple,
  ...props
}: DepartmentAutocompleteProps<Multiple>) {
  const [options, setOptions] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const deps = await departmentsApi.getDepartments(searchQuery);
        setOptions(deps);
      } catch (error) {
        console.error('Помилка пошуку підрозділів', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <Autocomplete
      multiple={multiple}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      inputValue={searchQuery}
      onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
      noOptionsText={searchQuery.trim() ? "Підрозділ не знайдено" : "Почніть вводити назву..."}
      forcePopupIcon={false}
      filterSelectedOptions
      blurOnSelect={!multiple}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            input: {
              ...((params as any).InputProps || params.slotProps?.input),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.slotProps?.input?.endAdornment || (params as any).InputProps?.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      {...props}
    />
  );
}