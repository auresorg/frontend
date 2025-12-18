'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { deleteWithToken, getWithToken } from '@/lib/utils';
import { RiMore2Fill, RiPencilLine, RiShareLine, RiDeleteBinLine, RiCloseLine } from '@remixicon/react';
import { isAxiosError } from 'axios';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRoot,
    TableRow,
} from '@/components/Table';
import { Button } from '@/components/Button';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';
import { useUserStore } from '@/store/userStore';
import { useAwardStore } from '@/store/awardStore';
import { useCertificateStore } from '@/store/certificateStore';
import { useProjectStore } from '@/store/projectStore';
import { useExperienceStore } from '@/store/experienceStore';
import { EntityConfig, Entity } from '@/lib/entityConfig';
import AddEntityDialog from './AddEntityDialog';
import EditEntityDialog from './EditEntityDialog';

interface EntityTableProps {
    config: EntityConfig;
}

export default function EntityTable({ config }: EntityTableProps) {
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [isClient, setIsClient] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

    const PresetDialog = usePresetDialog();
    const { editAwardCount, editCertCount, setUser, user } = useUserStore();

    // Get appropriate store based on entity type
    const awardStore = useAwardStore();
    const certificateStore = useCertificateStore();
    const projectStore = useProjectStore();
    const experienceStore = useExperienceStore();

    const entities = 
        config.type === 'award' ? awardStore.awards :
        config.type === 'certification' ? certificateStore.certificates :
        config.type === 'project' ? projectStore.projects :
        experienceStore.experiences;

    const hasLoaded = 
        config.type === 'award' ? awardStore.hasLoaded :
        config.type === 'certification' ? certificateStore.hasLoaded :
        config.type === 'project' ? projectStore.hasLoaded :
        experienceStore.hasLoaded;

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        async function fetchEntities() {
            if (!isClient || hasLoaded) return;

            if (localStorage.getItem('token') !== null) {
                try {
                    const response = await getWithToken(config.endpoint);
                    if (response && response.status === 200) {
                        if (config.type === 'award') {
                            awardStore.setAwards(response.data);
                            awardStore.setHasLoaded(true);
                        } else if (config.type === 'certification') {
                            certificateStore.setCertificates(response.data);
                            certificateStore.setHasLoaded(true);
                        } else if (config.type === 'project') {
                            projectStore.setProjects(response.data);
                            projectStore.setHasLoaded(true);
                        } else if (config.type === 'experience') {
                            experienceStore.setExperiences(response.data);
                            experienceStore.setHasLoaded(true);
                        }
                    }
                } catch (error) {
                    // Set hasLoaded to true even on error to prevent infinite retry loop
                    if (config.type === 'award') {
                        awardStore.setHasLoaded(true);
                    } else if (config.type === 'certification') {
                        certificateStore.setHasLoaded(true);
                    } else if (config.type === 'project') {
                        projectStore.setHasLoaded(true);
                    } else if (config.type === 'experience') {
                        experienceStore.setHasLoaded(true);
                    }

                    if (isAxiosError(error)) {
                        if (error.response?.status === 401) {
                            localStorage.removeItem("token");
                            PresetDialog("sessionExpired");
                        } else if (error.code === "ERR_NETWORK") {
                            PresetDialog("networkError");
                        }
                    } else {
                        PresetDialog("unexpectedError");
                    }
                }
            }
        }

        fetchEntities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [PresetDialog, hasLoaded, isClient, config.endpoint, config.type]);

    const openActionMenu = (entityId: string) => {
        const button = buttonRefs.current[entityId];
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const menuHeight = 130;
        let top = rect.bottom + window.scrollY;
        if (window.innerHeight - rect.bottom < menuHeight) {
            top = rect.top + window.scrollY - menuHeight;
        }
        setMenuPosition({ top, left: rect.right - 160 + window.scrollX });
        setActionMenuOpen(actionMenuOpen === entityId ? null : entityId);
    };

    const handleEdit = (entity: Entity) => {
        setEditingEntity(entity);
        setActionMenuOpen(null);
    };

    const handleDelete = (entityId: string, entityName: string) => {
        const confirmToast = toast({
            title: "Confirm Deletion",
            description: `Are you sure you want to delete "${entityName}"?`,
            variant: "error",
            action: {
                altText: "Confirm Delete",
                label: "Delete",
                onClick: async () => {
                    confirmToast.dismiss();

                    try {
                        const response = await deleteWithToken(`${config.endpoint}/${entityId}`);
                        if (response && response.status === 204) {
                            // Update store
                            if (config.type === 'award') {
                                awardStore.deleteAward(entityId);
                                editAwardCount(1, "decrement");
                            } else if (config.type === 'certification') {
                                certificateStore.deleteCertificate(entityId);
                                editCertCount(1, "decrement");
                            } else if (config.type === 'project') {
                                projectStore.deleteProject(entityId);
                                setUser({ ...user!, projectsCount: (user?.projectsCount ?? 0) - 1 });
                            } else if (config.type === 'experience') {
                                experienceStore.deleteExperience(entityId);
                                setUser({ ...user!, experienceCount: (user?.experienceCount ?? 0) - 1 });
                            }

                            toast({
                                title: `${config.singular} Deleted`,
                                description: `The ${config.singular.toLowerCase()} "${entityName}" has been deleted.`,
                                variant: "success",
                                duration: 4000,
                            });
                        }
                    } catch (error) {
                        if (isAxiosError(error)) {
                            if (error.response?.status === 401) {
                                PresetDialog("sessionExpired");
                            } else {
                                toast({
                                    title: "Deletion Failed",
                                    description: `An error occurred while deleting the ${config.singular.toLowerCase()} "${entityName}". Please try again.`,
                                    variant: "error",
                                    duration: 4000,
                                });
                            }
                        } else {
                            PresetDialog("unexpectedError");
                        }
                    }
                },
            },
        });

        setActionMenuOpen(null);
    };

    const handleShare = (entityId: string) => {
        console.log(`Share ${config.singular}:`, entityId);
        setActionMenuOpen(null);
    };

    const handleSave = (updatedEntity: Entity) => {
        const entityWithId = updatedEntity as { id: string };
        if (config.type === 'award') {
            awardStore.updateAward(updatedEntity as never);
        } else if (config.type === 'certification') {
            certificateStore.updateCertificate(updatedEntity as never);
        } else if (config.type === 'project') {
            projectStore.updateProject(entityWithId.id, updatedEntity as never);
        } else if (config.type === 'experience') {
            experienceStore.updateExperience(updatedEntity as never);
        }
        setEditingEntity(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderCellValue = (entity: Entity, columnKey: string) => {
        const value = (entity as Record<string, unknown>)[columnKey];
        
        // Format dates
        if (columnKey.includes('Date') || columnKey === 'date' || columnKey === 'completedOn') {
            return value ? formatDate(value as string) : '';
        }
        
        // Format arrays (like tech)
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        
        return String(value || '');
    };

    const getEntityName = (entity: Entity): string => {
        return (entity as Record<string, unknown>).title as string || 
               (entity as Record<string, unknown>).name as string || '';
    };

    return (
        <div className="obfuscate" style={{ height: '100%' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 sm:text-xl">
                        {config.plural}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        Overview of all your {config.plural.toLowerCase()}.
                    </p>
                </div>
                <div className="shrink-0">
                    <AddEntityDialog config={config} />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="mt-6 hidden lg:block">
                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 190px)' }}>
                    <TableRoot>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {config.tableColumns.map((column) => (
                                        <TableHeaderCell key={column.key}>
                                            {column.label}
                                        </TableHeaderCell>
                                    ))}
                                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!hasLoaded ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {config.tableColumns.map((column, idx) => (
                                                <TableCell 
                                                    key={column.key}
                                                    className={idx === 0 ? "font-medium text-gray-900 dark:text-gray-50" : ""}
                                                >
                                                    <div className="h-5 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right">
                                                <div className="flex justify-end">
                                                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : entities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={config.tableColumns.length + 1} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No records found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entities.map((entity) => (
                                        <TableRow key={(entity as { id: string }).id}>
                                            {config.tableColumns.map((column, idx) => (
                                                <TableCell 
                                                    key={column.key}
                                                    className={idx === 0 ? "font-medium text-gray-900 dark:text-gray-50" : ""}
                                                >
                                                    {column.render 
                                                        ? column.render((entity as Record<string, unknown>)[column.key], entity)
                                                        : renderCellValue(entity, column.key)
                                                    }
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right">
                                                <div className="relative flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        className="p-2!"
                                                        ref={el => { buttonRefs.current[(entity as { id: string }).id] = el; }}
                                                        onClick={() => openActionMenu((entity as { id: string }).id)}
                                                    >
                                                        {actionMenuOpen === (entity as { id: string }).id ? (
                                                            <RiCloseLine className="size-4" />
                                                        ) : (
                                                            <RiMore2Fill className="size-4" />
                                                        )}
                                                    </Button>

                                                    {actionMenuOpen === (entity as { id: string }).id && isClient &&
                                                        createPortal(
                                                            <div
                                                                className="absolute z-50 w-40 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-925"
                                                                style={{
                                                                    top: menuPosition.top,
                                                                    left: menuPosition.left,
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => handleEdit(entity)}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                                                >
                                                                    <RiPencilLine className="mr-2 size-4" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleShare((entity as { id: string }).id)}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                                                >
                                                                    <RiShareLine className="mr-2 size-4" />
                                                                    Share
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete((entity as { id: string }).id, getEntityName(entity))}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:text-red-500 dark:hover:bg-gray-900"
                                                                >
                                                                    <RiDeleteBinLine className="mr-2 size-4" />
                                                                    Delete
                                                                </button>
                                                            </div>,
                                                            document.body
                                                        )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableRoot>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="mt-6 space-y-4 lg:hidden">
                {!hasLoaded ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-925 animate-pulse"
                        >
                            <div className="flex items-start justify-between">
                                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800"></div>
                                <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800"></div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800"></div>
                                <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800"></div>
                                <div className="h-3 w-4/6 rounded bg-gray-200 dark:bg-gray-800"></div>
                            </div>
                        </div>
                    ))
                ) : entities.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No records found
                    </div>
                ) : (
                    entities.map((entity) => (
                        <div
                            key={(entity as { id: string }).id}
                            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-925"
                        >
                            <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                                    {getEntityName(entity)}
                                </h4>
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        className="p-1!"
                                        onClick={() => setActionMenuOpen(actionMenuOpen === (entity as { id: string }).id ? null : (entity as { id: string }).id)}
                                    >
                                        <RiMore2Fill className="size-4" />
                                    </Button>

                                    {actionMenuOpen === (entity as { id: string }).id && (
                                        <div className="absolute right-0 top-8 z-10 w-36 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-925">
                                            <button
                                                onClick={() => handleEdit(entity)}
                                                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                            >
                                                <RiPencilLine className="mr-2 size-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleShare((entity as { id: string }).id)}
                                                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                            >
                                                <RiShareLine className="mr-2 size-4" />
                                                Share
                                            </button>
                                            <button
                                                onClick={() => handleDelete((entity as { id: string }).id, getEntityName(entity))}
                                                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:text-red-500 dark:hover:bg-gray-900"
                                            >
                                                <RiDeleteBinLine className="mr-2 size-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {config.tableColumns.slice(1).map((column) => (
                                    <div key={column.key}>
                                        <span className="font-medium">{column.label}:</span>{' '}
                                        {column.render 
                                            ? column.render((entity as Record<string, unknown>)[column.key], entity)
                                            : renderCellValue(entity, column.key)
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>



            {/* Edit Dialog */}
            <EditEntityDialog
                config={config}
                entity={editingEntity}
                onClose={() => setEditingEntity(null)}
                onSave={handleSave}
            />
        </div>
    );
}
