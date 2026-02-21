import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortConfig {
    key: string;
    dir: SortDir;
}

export interface TableControlsOptions<T> {
    data: T[];
    searchFn: (item: T, q: string) => boolean;
    sortFns: Record<string, (a: T, b: T) => number>;
    filterFns: Record<string, (item: T, value: string) => boolean>;
    groupFn?: (item: T, groupKey: string) => string;
}

export function useTableControls<T>({
    data, searchFn, sortFns, filterFns, groupFn,
}: TableControlsOptions<T>) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortConfig>({ key: '', dir: 'asc' });
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [groupBy, setGroupBy] = useState('');

    const setFilter = (key: string, value: string) =>
        setFilters(prev => ({ ...prev, [key]: value }));

    const toggleSort = (key: string) => {
        setSort(prev =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' }
        );
    };

    const processed = useMemo(() => {
        let result = [...data];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(item => searchFn(item, q));
        }

        // Filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '__all__' && filterFns[key]) {
                result = result.filter(item => filterFns[key](item, value));
            }
        });

        // Sort
        if (sort.key && sortFns[sort.key]) {
            result.sort((a, b) => {
                const v = sortFns[sort.key](a, b);
                return sort.dir === 'asc' ? v : -v;
            });
        }

        return result;
    }, [data, search, filters, sort, searchFn, sortFns, filterFns]);

    /** When groupBy is set, returns items organised as [{group, items}] */
    const grouped = useMemo(() => {
        if (!groupBy || !groupFn) return null;
        const map = new Map<string, T[]>();
        processed.forEach(item => {
            const key = groupFn(item, groupBy);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        });
        return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
    }, [processed, groupBy, groupFn]);

    return {
        search, setSearch,
        sort, toggleSort,
        filters, setFilter,
        groupBy, setGroupBy,
        processed, grouped,
    };
}
