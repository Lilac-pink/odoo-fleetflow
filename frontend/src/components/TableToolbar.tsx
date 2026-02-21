import { Search, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { SortConfig } from '@/hooks/useTableControls';

interface FilterOption { label: string; value: string }
interface FilterDef { key: string; label: string; options: FilterOption[] }
interface SortOption { key: string; label: string }
interface GroupByOption { key: string; label: string }

interface TableToolbarProps {
    search: string;
    onSearchChange: (v: string) => void;
    sort: SortConfig;
    onToggleSort: (key: string) => void;
    sortOptions: SortOption[];
    filters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    filterDefs: FilterDef[];
    groupBy: string;
    onGroupByChange: (v: string) => void;
    groupByOptions: GroupByOption[];
    placeholder?: string;
}

const SortIcon = ({ fieldKey, sort }: { fieldKey: string; sort: SortConfig }) => {
    if (sort.key !== fieldKey) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sort.dir === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
        : <ChevronDown className="h-3.5 w-3.5 text-primary" />;
};

export const TableToolbar = ({
    search, onSearchChange,
    sort, onToggleSort, sortOptions,
    filters, onFilterChange, filterDefs,
    groupBy, onGroupByChange, groupByOptions,
    placeholder = 'Search…',
}: TableToolbarProps) => {
    const activeFilters = Object.values(filters).filter(v => v && v !== '__all__').length;

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    className="pl-9"
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>

            {/* Sort */}
            {sortOptions.length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            {sort.key
                                ? <><SortIcon fieldKey={sort.key} sort={sort} />{sortOptions.find(o => o.key === sort.key)?.label}</>
                                : <><ChevronsUpDown className="h-4 w-4" />Sort</>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1" align="start">
                        {sortOptions.map(o => (
                            <button
                                key={o.key}
                                onClick={() => onToggleSort(o.key)}
                                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
                            >
                                {o.label}
                                <SortIcon fieldKey={o.key} sort={sort} />
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
            )}

            {/* Filters */}
            {filterDefs.length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filter
                            {activeFilters > 0 && (
                                <Badge variant="secondary" className="h-4 px-1 text-xs">{activeFilters}</Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3 space-y-2" align="start">
                        {filterDefs.map(fd => (
                            <div key={fd.key} className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">{fd.label}</p>
                                <Select
                                    value={filters[fd.key] || '__all__'}
                                    onValueChange={v => onFilterChange(fd.key, v)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All</SelectItem>
                                        {fd.options.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                        {activeFilters > 0 && (
                            <Button
                                variant="ghost" size="sm" className="w-full text-xs mt-1"
                                onClick={() => filterDefs.forEach(fd => onFilterChange(fd.key, '__all__'))}
                            >
                                Clear filters
                            </Button>
                        )}
                    </PopoverContent>
                </Popover>
            )}

            {/* Group By */}
            {groupByOptions.length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <Layers className="h-4 w-4" />
                            {groupBy ? `Grouped: ${groupByOptions.find(o => o.key === groupBy)?.label}` : 'Group By'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1" align="start">
                        <button
                            onClick={() => onGroupByChange('')}
                            className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-accent"
                        >
                            No grouping
                        </button>
                        {groupByOptions.map(o => (
                            <button
                                key={o.key}
                                onClick={() => onGroupByChange(o.key)}
                                className={`flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-accent ${groupBy === o.key ? 'text-primary font-medium' : ''}`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
};

/** A group header row to insert between groups */
export const GroupHeaderRow = ({ label, count, colSpan }: { label: string; count: number; colSpan: number }) => (
    <tr>
        <td colSpan={colSpan} className="bg-muted/50 px-4 py-1.5 text-xs font-semibold text-muted-foreground border-b">
            {label} <span className="ml-1 font-normal">({count})</span>
        </td>
    </tr>
);
