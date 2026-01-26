'use client';

import { BaseAPI } from '@/lib/utils'
import { useEffect } from 'react'

function Ping() {
    useEffect(() => {
        BaseAPI.get("/auth/ping");
    }, []);
    return null
}

export default Ping