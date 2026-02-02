"use client"

import { useRef, useState } from "react"
import {
    RiCloseLine,
    RiFileLine,
    RiFilePdfLine,
    RiFileWordLine,
} from "@remixicon/react"

import { ProgressBar } from "@/components/ProgressBar"
import { extractText } from "unpdf"
import {
    getWithToken,
    postWithToken,
    postWithTokenNextEndpoint,
    putWithToken,
} from "@/lib/utils"

import { useProjectStore } from "@/store/projectStore"
import { useExperienceStore } from "@/store/experienceStore"
import { useCertificateStore } from "@/store/certificateStore"
import { useAwardStore } from "@/store/awardStore"
import { useUserStore } from "@/store/userStore"
import { useEducationStore } from "@/store/educationStore"

import type {
    Project,
    Experience,
    Certification,
    Award,
    Education,
} from "@/lib/types"

type Status = string

export default function ResumeImportCard({
    onStatusChange,
}: {
    onStatusChange?: (s: Status | null) => void
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<Status | null>(null)

    const { addProject } = useProjectStore()
    const { addExperience } = useExperienceStore()
    const { addCertificate } = useCertificateStore()
    const { addAward } = useAwardStore()
    const { user, updateUser, editSkills } = useUserStore()
    const { updateEducation } = useEducationStore()

    const updateStatus = (s: Status) => {
        setStatus(s)
        onStatusChange?.(s)
    }

      const emitStatus = (s: Status) => {
        setStatus(s)
        onStatusChange?.(s)
    }

    const parsePdf = async (file: File) => {
        updateStatus("Reading PDF")
        const buffer = await file.arrayBuffer()

        updateStatus("Extracting text")
        const { text } = await extractText(buffer)

        updateStatus("Analyzing resume")
        const parsed = await postWithTokenNextEndpoint("/parseResume", {
            text: text.join("\n"),
        })

        if (!parsed?.data) return

        const data = parsed.data as {
            user?: any
            education?: Education
            projects?: Project[]
            experience?: Experience[]
            certifications?: Certification[]
            awards?: Award[]
            skills?: string[]
        }

        let completed = 0
        const total =
            (data.projects?.length || 0) * 2 +
            (data.experience?.length || 0) * 2 +
            (data.certifications?.length || 0) * 2 +
            (data.awards?.length || 0) +
            (data.skills?.length ? 1 : 0) +
            (data.user ? 1 : 0) +
            (data.education ? 1 : 0)

        const tick = () => {
            completed++
            setProgress(
                Math.min(100, Math.round((completed / total) * 100))
            )
        }

        if (data.user && user) {
            updateStatus("Updating profile")
            const res = await putWithToken("/user", data.user)
            if (res?.status === 200) updateUser(data.user)
            tick()
        }

        if (data.education) {
            updateStatus("Updating education")
            const existing = await getWithToken("/education")
            if (existing?.data) {
                const merged = { ...existing.data, ...data.education }
                const res = await putWithToken("/education", merged)
                if (res?.status === 200) updateEducation(merged)
            }
            tick()
        }

        for (const p of data.projects || []) {
            updateStatus(`Adding project: ${p.name}`)
            const enhanced = await postWithTokenNextEndpoint("/create", {
                ...p,
                type: "project",
            })
            tick()

            updateStatus(`Writing description for ${p.name}`)
            const res = await postWithToken("/projects", {
                ...p,
                description: enhanced?.data?.description ?? p.description,
                repo: p.repo || "https://example.com",
            })
            addProject(res.data)
            tick()
        }

        for (const e of data.experience || []) {
            updateStatus(`Adding experience: ${e.title}`)
            const enhanced = await postWithTokenNextEndpoint("/create", {
                ...e,
                type: "experience",
            })
            tick()

            updateStatus(`Writing description for ${e.title}`)
            const res = await postWithToken("/experiences", {
                ...e,
                description: enhanced?.data?.description ?? e.description,
            })
            addExperience(res.data)
            tick()
        }

        for (const c of data.certifications || []) {
            updateStatus(`Adding certification: ${c.title}`)
            const enhanced = await postWithTokenNextEndpoint("/create", {
                ...c,
                type: "certification",
            })
            tick()

            const res = await postWithToken("/certifications", {
                ...c,
                description: enhanced?.data?.description ?? c.description,
            })
            addCertificate(res.data)
            tick()
        }

        for (const a of data.awards || []) {
            updateStatus(`Adding award: ${a.title}`)
            const res = await postWithToken("/awards", { ...a })
            addAward(res.data)
            tick()
        }

        if (data.skills?.length) {
            updateStatus("Updating skills")
            editSkills(data.skills, "add")
            tick()
        }

        updateStatus("Done")
        setProgress(100)
    }

    const handleFile = (selected: File) => {
        setFile(selected)
        setProgress(0)
        setStatus(null)
        if (selected.type === "application/pdf") {
            parsePdf(selected)
        }
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (selected) handleFile(selected)
    }

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const dropped = e.dataTransfer.files?.[0]
        if (dropped) handleFile(dropped)
    }

    const reset = () => {
        setFile(null)
        setProgress(0)
        setStatus(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    const Icon =
        file?.type.includes("pdf")
            ? RiFilePdfLine
            : file?.type.includes("word")
            ? RiFileWordLine
            : RiFileLine

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Import data from resume
            </h3>

            {!file && (
                <div
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="mt-4 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-8 dark:border-gray-800"
                >
                    <div>
                        <RiFileLine className="mx-auto size-12 text-gray-400 dark:text-gray-500" />
                        <div className="mt-4 flex text-sm/6 text-gray-500 dark:text-gray-500">
                            <p>Drag and drop or</p>
                            <label
                                onClick={() => inputRef.current?.click()}
                                className="pl-1 cursor-pointer font-medium text-blue-500 hover:underline"
                            >
                                choose file
                            </label>
                            <p className="pl-1">to upload</p>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf"
                            onChange={onInputChange}
                            className="sr-only"
                        />
                    </div>
                </div>
            )}

            {file && (
                <div className="relative mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <button
                        onClick={reset}
                        className="absolute right-1 top-1 rounded-md p-2 text-gray-400"
                    >
                        <RiCloseLine className="size-5" />
                    </button>

                    <div className="flex items-center space-x-2.5">
                        <span className="flex size-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:ring-gray-800">
                            <Icon className="size-5 text-gray-700 dark:text-gray-300" />
                        </span>
                        <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center space-x-3">
                        <ProgressBar value={progress} />
                        <span className="text-xs text-gray-500">
                            {status ?? `${progress}%`}
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-8 border-t border-gray-200 dark:border-gray-800" />
        </div>
    )
}
