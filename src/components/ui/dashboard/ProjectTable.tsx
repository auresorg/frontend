'use client';

import { useEffect, useState } from 'react';
import { cx, deleteWithToken, getWithToken } from '@/lib/utils';
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
import AddProjectDialog from './AddProjectDialog';
import EditProjectDialog from './EditProjectDialog';
import { Project } from '@/lib/types';
import { useProjectStore } from '@/store/projectStore';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUserStore } from '@/store/userStore';


export default function ProjectsTable() {

    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const openActionMenu = (projectId: string) => {
        const button = buttonRefs.current[projectId];
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const menuHeight = 130; // approx height of menu, adjust if needed
        let top = rect.bottom + window.scrollY;
        if (window.innerHeight - rect.bottom < menuHeight) {
            // flip above button if not enough space
            top = rect.top + window.scrollY - menuHeight;
        }
        setMenuPosition({ top, left: rect.right - 160 + window.scrollX }); // adjust width
        setActionMenuOpen(actionMenuOpen === projectId ? null : projectId);
    };


    const [isClient, setIsClient] = useState(false)
    useEffect(() => { setIsClient(true) }, [])

    const { projects, hasLoaded, setHasLoaded, setProjects, deleteProject, updateProject } = useProjectStore();
    const PresetDialog = usePresetDialog()

    const { editProjectsCount, editSkills } = useUserStore();

    useEffect(() => {
        async function fetchProjects() {
            if (!isClient) return;
            if (!hasLoaded) {
                if (localStorage.getItem('token') !== null) {
                    try {
                        const response = await getWithToken("/projects")
                        if (response && response.status === 200) {
                            setProjects(response.data)
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

        fetchProjects();
    }, [PresetDialog, hasLoaded, isClient, projects.length, setHasLoaded, setProjects]);

    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setActionMenuOpen(null);
    };

    const handleDelete = (projectId: string, projectName: string, skills: string[]) => {
        const confirmToast = toast({
            title: "Confirm Deletion",
            description: `Are you sure you want to delete "${projectName}"?`,
            variant: "error",
            action: {
                altText: "Confirm Delete",
                label: "Delete",
                onClick: async () => {
                    // Hide the first toast before showing next
                    confirmToast.dismiss();

                    try {
                        const response = await deleteWithToken(`/projects/${projectId}`);
                        if (response && response.status === 204) {
                            deleteProject(projectId);
                            editSkills(skills, "remove");
                            editProjectsCount(1, "decrement");


                            toast({
                                title: "Project Deleted",
                                description: `The project "${projectName}" has been deleted.`,
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
                                    description: `An error occurred while deleting the project "${projectName}". Please try again.`,
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

    const handleShare = (projectId: string) => {
        console.log('Share project:', projectId);
        setActionMenuOpen(null);
    };

    const data = projects;

    return (
        <div className="obfuscate" style={{ height: '100%' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 sm:text-xl">
                        Projects
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        Overview of all your development projects.
                    </p>
                </div>
                <div className="shrink-0">
                    <AddProjectDialog />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="mt-6 hidden lg:block">
                <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 190px)' }}>
                    <TableRoot>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeaderCell>Name</TableHeaderCell>
                                    <TableHeaderCell>Repository</TableHeaderCell>
                                    <TableHeaderCell>Technologies</TableHeaderCell>
                                    <TableHeaderCell>Role</TableHeaderCell>
                                    <TableHeaderCell>Status</TableHeaderCell>
                                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {item.repo}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {item.tech.map((tech) => (
                                                    <span
                                                        key={tech}
                                                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : ''}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cx(
                                                    !item.endDate || item.endDate === 'Present'
                                                        ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/10 dark:bg-emerald-500/20 dark:text-emerald-500 dark:ring-emerald-400/20'
                                                        : 'bg-gray-100 text-gray-800 ring-gray-600/10 dark:bg-gray-500/20 dark:text-gray-500 dark:ring-gray-400/20',
                                                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                                                )}
                                            >
                                                {!item.endDate || item.endDate === 'Present' ? 'Active' : 'Completed'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="relative flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    className="!p-2"
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
                                                                onClick={() => handleDelete(item.id, item.name, item.tech)}
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
                                ))}
                            </TableBody>
                        </Table>
                    </TableRoot>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="mt-6 space-y-4 lg:hidden">
                {data.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-925"
                    >
                        <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                                {item.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span
                                    className={cx(
                                        !item.endDate || item.endDate === 'Present'
                                            ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/10 dark:bg-emerald-500/20 dark:text-emerald-500 dark:ring-emerald-400/20'
                                            : 'bg-gray-100 text-gray-800 ring-gray-600/10 dark:bg-gray-500/20 dark:text-gray-500 dark:ring-gray-400/20',
                                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                                    )}
                                >
                                    {!item.endDate || item.endDate === 'Present' ? 'Active' : 'Completed'}
                                </span>

                                {/* Mobile Actions */}
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        className="!p-1"
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
                                                onClick={() => handleDelete(item.id, item.name, item.tech)}
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

                        <div className="mt-3 space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-gray-500 dark:text-gray-500">Repo: </span>
                                <span className="font-mono text-gray-900 dark:text-gray-50">{item.repo}</span>
                            </div>

                            <div>
                                <span className="font-medium text-gray-500 dark:text-gray-500">Role: </span>
                                <span className="text-gray-900 dark:text-gray-50">
                                    {item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : ''}
                                </span>
                            </div>

                            <div>
                                <span className="font-medium text-gray-500 dark:text-gray-500">Technologies: </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {item.tech.map((tech) => (
                                        <span
                                            key={tech}
                                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Dialog */}
            {editingProject && (
                <EditProjectDialog
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={(updatedProject) => {

                        let addedTech: string[] = [];
                        let removedTech: string[] = [];

                        const oldProject = projects.find(p => p.id === updatedProject.id);
                        if (oldProject) {
                            const oldTechSet = new Set(oldProject.tech);
                            const newTechSet = new Set(updatedProject.tech);
                            addedTech = updatedProject.tech.filter(tech => !oldTechSet.has(tech));
                            removedTech = oldProject.tech.filter(tech => !newTechSet.has(tech));
                        }

                        updateProject(updatedProject.id, updatedProject);

                        editSkills(addedTech, "add");
                        editSkills(removedTech, "remove");

                        setEditingProject(null);
                    }}
                />
            )}
        </div>
    );
}