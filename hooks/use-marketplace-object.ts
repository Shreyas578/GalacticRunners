import { useState, useEffect } from 'react'

interface MarketplaceObjectInfo {
    objectId: string
    initialSharedVersion: number | null
    loading: boolean
    error: string | null
}

export function useMarketplaceObject(objectId: string): MarketplaceObjectInfo {
    const [info, setInfo] = useState<MarketplaceObjectInfo>({
        objectId,
        initialSharedVersion: null,
        loading: true,
        error: null,
    })

    useEffect(() => {
        const fetchObjectInfo = async () => {
            if (!objectId || objectId === '0x0') {
                setInfo(prev => ({ ...prev, loading: false, error: 'Invalid object ID' }))
                return
            }

            try {
                const response = await fetch('/api/onechain/object', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ objectId }),
                })

                const data = await response.json()

                if (data.success && data.initialSharedVersion !== null) {
                    console.log('✅ Marketplace object info:', data)
                    setInfo({
                        objectId,
                        initialSharedVersion: parseInt(data.initialSharedVersion),
                        loading: false,
                        error: null,
                    })
                } else {
                    setInfo(prev => ({
                        ...prev,
                        loading: false,
                        error: data.error || 'Failed to fetch object info'
                    }))
                }
            } catch (error: any) {
                console.error('❌ Error fetching marketplace object:', error)
                setInfo(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }))
            }
        }

        fetchObjectInfo()
    }, [objectId])

    return info
}
