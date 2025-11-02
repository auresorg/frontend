import { create } from 'zustand'
import { Certification } from '@/lib/types'

interface CertificateStore {
    certificates: Certification[]
    hasLoaded: boolean
    setCertificates: (certificates: Certification[]) => void
    setHasLoaded: (hasLoaded: boolean) => void
    addCertificate: (certificate: Certification) => void
    updateCertificate: (certificate: Certification) => void
    deleteCertificate: (certificateId: string) => void
}

export const useCertificateStore = create<CertificateStore>((set) => ({
    certificates: [],
    hasLoaded: false,
    setCertificates: (certificates) => set({ certificates }),
    setHasLoaded: (hasLoaded) => set({ hasLoaded }),
    addCertificate: (certificate) => set((state) => ({ 
        certificates: [...state.certificates, certificate] 
    })),
    updateCertificate: (certificate) => set((state) => ({
        certificates: state.certificates.map((c) => 
            c.id === certificate.id ? certificate : c
        )
    })),
    deleteCertificate: (certificateId) => set((state) => ({
        certificates: state.certificates.filter((c) => c.id !== certificateId)
    })),
}))