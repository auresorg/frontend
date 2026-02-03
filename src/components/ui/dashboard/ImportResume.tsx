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
    postWithTokenNextEndpoint,
    postWithToken,
} from "@/lib/utils"

import { useProjectStore } from "@/store/projectStore"
import { useExperienceStore } from "@/store/experienceStore"
import { useCertificateStore } from "@/store/certificateStore"
import { useAwardStore } from "@/store/awardStore"
import { useUserStore } from "@/store/userStore"
import { useEducationStore } from "@/store/educationStore"

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
    const [isBusy, setIsBusy] = useState(false)

    const updateStatus = (s: Status) => {
        setStatus(s)
        onStatusChange?.(s)
    }

    //fetch current username from UserStore
    const username = useUserStore((state) => state.user?.username);

    const parsePdf = async (file: File) => {
        setIsBusy(true)
        try {
            /* ---------- UPLOAD ---------- */
            updateStatus("Reading PDF")
            setProgress(10)

            const buffer = await file.arrayBuffer()

            updateStatus("Extracting text")
            setProgress(30)

            const { text } = await extractText(buffer)
            const joinedText = text.join("\n")

            /* ---------- PARSE ---------- */
            updateStatus("Parsing resume")
            setProgress(50)

            const parsed = await postWithTokenNextEndpoint("/parseResume", {
                username: username,
                text: joinedText,
            })

            if (!parsed?.data?.data) {
                throw new Error("Parse resume failed")
            }


            /* ---------- BULK IMPORT ---------- */
            updateStatus("Importing data")
            setProgress(65)

            const payload = parsed.data.data

            await postWithToken("/bulk", payload)

            /* ---------- UPDATE STORES ---------- */
            updateStatus("Updating local state")
            setProgress(85)

            const { updateUser } = useUserStore.getState()
            const { updateEducation } = useEducationStore.getState()
            const { addProject } = useProjectStore.getState()
            const { addExperience } = useExperienceStore.getState()
            const { addCertificate } = useCertificateStore.getState()
            const { addAward } = useAwardStore.getState()

            if (payload.user) {
                updateUser(payload.user)
            }

            if (payload.education) {
                updateEducation(payload.education)
            }

            for (const p of payload.projects || []) {
                addProject(p)
            }

            for (const e of payload.experience || []) {
                addExperience(e)
            }

            for (const c of payload.certifications || []) {
                addCertificate(c)
            }

            for (const a of payload.awards || []) {
                addAward(a)
            }

            updateStatus("Done")
            setProgress(100)

        } catch (err) {
            console.error(err)
            updateStatus("Failed")
            setProgress(0)
        } finally {
            setIsBusy(false)
        }
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
                        disabled={isBusy}
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