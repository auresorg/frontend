'use client';

import { useEffect, useState, useRef } from 'react';
import { deleteWithToken, getWithToken } from '@/lib/utils';
import { RiMore2Fill, RiPencilLine, RiShareLine, RiDeleteBinLine, RiCloseLine } from '@remixicon/react';

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
import AddExperienceDialog from './AddExperienceDialog';
import EditExperienceDialog from './EditExperienceDialog';
import { Experience } from '@/lib/types';
import { useExperienceStore } from '@/store/experienceStore';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';
import { createPortal } from 'react-dom';
import { useUserStore } from '@/store/userStore';

export default function ExperiencesTable() {
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const openActionMenu = (expId: string) => {
        const button = buttonRefs.current[expId];
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const menuHeight = 130;
        let top = rect.bottom + window.scrollY;
        if (window.innerHeight - rect.bottom < menuHeight) {
            top = rect.top + window.scrollY - menuHeight;
        }
        setMenuPosition({ top, left: rect.right - 160 + window.scrollX });
        setActionMenuOpen(actionMenuOpen === expId ? null : expId);
    };

    const [isClient, setIsClient] = useState(false)
    useEffect(() => { setIsClient(true) }, [])

    const { experiences, hasLoaded, setHasLoaded, setExperiences, deleteExperience, updateExperience } = useExperienceStore();
    const PresetDialog = usePresetDialog()

    const { editExperienceCount } = useUserStore();

    useEffect(() => {
        async function fetchExperiences() {
            if (!isClient) return;
            if (!hasLoaded) {
                if (localStorage.getItem('token') !== null) {
                    try {
                        const response = await getWithToken("/experiences")
                        if (response && response.status === 200) {
                            setExperiences(response.data)
                            setHasLoaded(true)
                        }
                    } catch (error) {
                        if (isAxiosError(error)) {
                            if (error.response?.status === 401) {
                                localStorage.removeItem("token")
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
        }

        fetchExperiences();
    }, [PresetDialog, hasLoaded, isClient, experiences.length, setHasLoaded, setExperiences]);

    const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

    const handleEdit = (exp: Experience) => {
        setEditingExperience(exp);
        setActionMenuOpen(null);
    };

    const handleDelete = (expId: string, title: string) => {
        const confirmToast = toast({
            title: "Confirm Deletion",
            description: `Are you sure you want to delete "${title}"?`,
            variant: "error",
            action: {
                altText: "Confirm Delete",
                label: "Delete",
                onClick: async () => {
                    confirmToast.dismiss();

                    try {
                        const response = await deleteWithToken(`/experiences/${expId}`);
                        if (response && response.status === 204) {
                            deleteExperience(expId);
                            editExperienceCount(1, "decrement");

                            toast({
                                title: "Experience Deleted",
                                description: `The experience "${title}" has been deleted.`,
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
                                    description: `An error occurred while deleting the experience "${title}". Please try again.`,
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

    const handleShare = (expId: string) => {
        console.log('Share experience:', expId);
        setActionMenuOpen(null);
    };

    const data = experiences;

    return (
        <div className="obfuscate" style={{ height: '100%' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 sm:text-xl">
                        Experience
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        Overview of your professional experiences.
                    </p>
                </div>
                <div className="shrink-0">
                    <AddExperienceDialog />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="mt-6 hidden lg:block">
                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 190px)' }}>
                    <TableRoot>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeaderCell>Title</TableHeaderCell>
                                    <TableHeaderCell>Company</TableHeaderCell>
                                    <TableHeaderCell>Start</TableHeaderCell>
                                    <TableHeaderCell>End</TableHeaderCell>
                                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((item: Experience) => {
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                                {item.title}
                                            </TableCell>
                                            <TableCell>
                                                {item.company}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(item.startDate).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                }) : 'Present'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="relative flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        className="p-2!"
                                                        ref={el => { buttonRefs.current[item.id] = el; }}
                                                        onClick={() => openActionMenu(item.id)}
                                                    >
                                                        {actionMenuOpen === item.id ? (
                                                            <RiCloseLine className="size-4" />
                                                        ) : (
                                                            <RiMore2Fill className="size-4" />
                                                        )}
                                                    </Button>

                                                    {actionMenuOpen === item.id && isClient &&
                                                        createPortal(
                                                            <div
                                                                className="absolute z-50 w-40 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-925"
                                                                style={{
                                                                    top: menuPosition.top,
                                                                    left: menuPosition.left,
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                                                >
                                                                    <RiPencilLine className="mr-2 size-4" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleShare(item.id)}
                                                                    className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                                                >
                                                                    <RiShareLine className="mr-2 size-4" />
                                                                    Share
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id, item.title)}
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
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableRoot>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="mt-6 space-y-4 lg:hidden">
                {data.map((item: Experience) => {
                    return (
                        <div
                            key={item.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-925"
                        >
                            <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                                    {item.title}
                                </h4>
                                {/* Mobile Actions */}
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        className="p-1!"
                                        onClick={() => setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)}
                                    >
                                        <RiMore2Fill className="size-4" />
                                    </Button>

                                    {actionMenuOpen === item.id && (
                                        <div className="absolute right-0 top-8 z-10 w-36 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-925">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                            >
                                                <RiPencilLine className="mr-2 size-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleShare(item.id)}
                                                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                            >
                                                <RiShareLine className="mr-2 size-4" />
                                                Share
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, item.title)}
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
                                <div>
                                    <span className="font-medium">Company:</span> {item.company}
                                </div>
                                <div>
                                    <span className="font-medium">Start:</span>{' '}
                                    {new Date(item.startDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                                <div>
                                    <span className="font-medium">End:</span>{' '}
                                    {item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    }) : 'Present'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Dialog */}
            <EditExperienceDialog
                experience={editingExperience}
                onClose={() => setEditingExperience(null)}
                onSave={(updatedExperience: Experience) => {
                    updateExperience(updatedExperience);
                    setEditingExperience(null);
                }}
            />
        </div>
    );
}
