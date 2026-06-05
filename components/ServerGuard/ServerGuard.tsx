'use client'

import { useEffect,useState } from "react"

export default function ServerGuard(){
    const [isServerAwake,setIsServerAwake] = useState<boolean | null>(null)

    useEffect(()=>{
        const checkServerHealth = async()=>{
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

            const timeOutId= setTimeout(()=>{
                setIsServerAwake(false)
            },2000)

            try{
                const res = await fetch(`${BACKEND_URL}/api/health`)
                if(!res.ok){
                    clearTimeout(timeOutId)
                    setIsServerAwake(true)
                }
            }catch(error){
                console.error(`Backend Ping Failed`)
            }
        }
        checkServerHealth()
    },[])

    if(isServerAwake === null || isServerAwake === true) return null

    return(
        <div className="w-full bg-blue-50 border-b border-blue-200 px-4 py-3 text-sm text-blue-800 text-center font-medium animate-pulse z-50">
      <span className="mr-2">⏳</span>
      Waking up the cloud server (Render free-tier cold start). Initial data fetching may take up to 45 seconds. Thank you for your patience!
    </div>
    )


}
