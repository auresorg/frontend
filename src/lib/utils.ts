// Tremor Raw cx [v0.0.0]

import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios";


export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args))
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Tremor focusInput [v0.0.2]

export const focusInput = [
  // base
  "focus:ring-2",
  // ring color
  "focus:ring-blue-200 dark:focus:ring-blue-700/30",
  // border color
  "focus:border-blue-500 dark:focus:border-blue-700",
]

// Tremor Raw focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-blue-500 dark:outline-blue-500",
]

// Tremor Raw hasErrorInput [v0.0.1]

export const hasErrorInput = [
  // base
  "ring-2",
  // border color
  "border-red-500 dark:border-red-700",
  // ring color
  "ring-red-200 dark:ring-red-700/30",
]
export const host = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://aures-hwdcfmdzfhfrhna9.centralindia-01.azurewebsites.net";

export const nextBase = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://calm-pond-02bf0a01e.3.azurestaticapps.net";

export const API = axios.create({
    baseURL: host + "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

export const BaseAPI = axios.create({
    baseURL: host,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getWithToken = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return await API.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export const getWithTokenCached = async (url: string, ttl = 1000 * 60 * 60) => {
    //ttl is in milliseconds, default is 1 hour
    const token = localStorage.getItem('token');
    if (!token) return null;

    const cacheKey = 'cached_' + url;

    try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);

            if (
                typeof cached.timestamp === 'number' &&
                cached.response &&
                typeof cached.response.status === 'number' &&
                cached.response.data !== undefined &&
                Date.now() - cached.timestamp < ttl
            ) {
                return {
                    status: cached.response.status,
                    statusText: cached.response.statusText ?? 'OK',
                    headers: {},
                    config: {},
                    data: cached.response.data,
                };
            }
        }
    } catch (e) {
        console.warn("Error reading/parsing cache", e);
    }

    const response = await getWithToken(url);
    if (!response) return null;

    try {
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            response: {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
            }
        }));
    } catch (e) {
        console.warn("Failed to save cache", e);
    }

    return response;
};


export const postFileWithToken = async (url: string, file: File, name: string) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const formData = new FormData();
    formData.append(name, file);
    return await API.postForm(url, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
}

export const postWithToken = async (url: string, data: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    return await API.post(url, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export const postWithTokenNextEndpoint = async (url: string, data: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const fullUrl = `${nextBase}/api${url}`;
    return await axios.post(fullUrl, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

export const deleteWithToken = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return await API.delete(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export const putWithToken = async (url: string, data: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return await API.put(url, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export const roles = [
        { value: 'fullstack', label: 'Fullstack Developer' },
        { value: 'backend', label: 'Backend Developer' },
        { value: 'frontend', label: 'Frontend Developer' },
        { value: 'devops', label: 'DevOps Engineer' },
        { value: 'mobile', label: 'Mobile Developer' },
        { value: 'aiml', label: 'AI/ML Engineer' },
        { value: 'product', label: 'Product Manager' },
        { value: 'qa', label: 'QA Engineer' },
        { value: 'designer', label: 'Designer' },
        { value: 'blockchain', label: 'Blockchain Developer' }
    ]