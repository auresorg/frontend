'use client';

import { useEffect, useState } from 'react';
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
import AddAwardDialog from './AddAwardDialog';
import EditAwardDialog from './EditAwardDialog';
import { Award } from '@/lib/types';
import { useAwardStore } from '@/store/awardStore';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUserStore } from '@/store/userStore';

export default function AwardsTable() {
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const openActionMenu = (awardId: string) => {
        const button = buttonRefs.current[awardId];
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const menuHeight = 130;
        let top = rect.bottom + window.scrollY;
        if (window.innerHeight - rect.bottom < menuHeight) {
            top = rect.top + window.scrollY - menuHeight;
        }
        setMenuPosition({ top, left: rect.right - 160 + window.scrollX });
        setActionMenuOpen(actionMenuOpen === awardId ? null : awardId);
    };

    const [isClient, setIsClient] = useState(false)
    useEffect(() => { setIsClient(true) }, [])

    const { awards, hasLoaded, setHasLoaded, setAwards, deleteAward, updateAward } = useAwardStore();
    const PresetDialog = usePresetDialog()

    const { editAwardCount } = useUserStore();

    useEffect(() => {
        async function fetchAwards() {
            if (!isClient) return;
            if (!hasLoaded) {
                if (localStorage.getItem('token') !== null) {
                    try {
                        const response = await getWithToken("/awards")
                        if (response && response.status === 200) {
                            setAwards(response.data)
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

        fetchAwards();
    }, [PresetDialog, hasLoaded, isClient, awards.length, setHasLoaded, setAwards]);

    const [editingAward, setEditingAward] = useState<Award | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

    const handleEdit = (award: Award) => {
        setEditingAward(award);
        setActionMenuOpen(null);
    };

    const handleDelete = (awardId: string, awardTitle: string) => {
        const confirmToast = toast({
            title: "Confirm Deletion",
            description: `Are you sure you want to delete "${awardTitle}"?`,
            variant: "error",
            action: {
                altText: "Confirm Delete",
                label: "Delete",
                onClick: async () => {
                    confirmToast.dismiss();

                    try {
                        const response = await deleteWithToken(`/awards/${awardId}`);
                        if (response && response.status === 204) {
                            deleteAward(awardId);
                            editAwardCount(1, "decrement");

                            toast({
                                title: "Award Deleted",
                                description: `The award "${awardTitle}" has been deleted.`,
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
                                    description: `An error occurred while deleting the award "${awardTitle}". Please try again.`,
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

    const handleShare = (awardId: string) => {
        console.log('Share award:', awardId);
        setActionMenuOpen(null);
    };

    const getTypeBadge = (type: string) => {
        const typeConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "neutral" }> = {
            hackathon: { label: "Hackathon", variant: "success" },
            competition: { label: "Competition", variant: "warning" },
            achievement: { label: "Achievement", variant: "default" },
            recognition: { label: "Recognition", variant: "neutral" },
            scholarship: { label: "Scholarship", variant: "success" },
        };
        
        return typeConfig[type] || { label: type, variant: "default" };
    };

    const data = awards;

    return (
        <div className="obfuscate" style={{ height: '100%' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 sm:text-xl">
                        Awards & Achievements
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        Overview of all your awards, hackathons, and achievements.
                    </p>
                </div>
                <div className="shrink-0">
                    <AddAwardDialog />
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
                                    <TableHeaderCell>Issuer</TableHeaderCell>
                                    <TableHeaderCell>Type</TableHeaderCell>
                                    <TableHeaderCell>Date</TableHeaderCell>
                                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((item) => {
                                    const typeInfo = getTypeBadge(item.type);
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                                {item.title}
                                            </TableCell>
                                            <TableCell>
                                                {item.issuer}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeInfo.variant}-100 text-${typeInfo.variant}-800 dark:bg-${typeInfo.variant}-900 dark:text-${typeInfo.variant}-300`}>
                                                    {typeInfo.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(item.date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
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
                {data.map((item) => {
                    const typeInfo = getTypeBadge(item.type);
                    return (
                        <div
                            key={item.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-925"
                        >
                            <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeInfo.variant}-100 text-${typeInfo.variant}-800 dark:bg-${typeInfo.variant}-900 dark:text-${typeInfo.variant}-300`}>
                                        {typeInfo.label}
                                    </span>
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
                            </div>
                            <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <span className="font-medium">Issuer:</span> {item.issuer}
                                </div>
                                <div>
                                    <span className="font-medium">Date:</span>{' '}
                                    {new Date(item.date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Dialog */}
            <EditAwardDialog
                award={editingAward}
                onClose={() => setEditingAward(null)}
                onSave={(updatedAward: Award) => {
                    updateAward(updatedAward);
                    setEditingAward(null);
                }}
            />
        </div>
    );
}