'use client'
import { Button } from '@/components/ui/button'
import React from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { PiGearSixDuotone } from 'react-icons/pi'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServiceContext } from '../context/ServiceContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const services = [
  { label: 'Electrician Service', value: 'Electrician Service' },
  { label: 'Plumbing Service', value: 'Plumbing' },
  { label: 'Carpenter', value: 'Carpentry' },
  { label: 'AC Maintenance', value: 'AC Maintenance' },
  { label: 'Solar Technician', value: 'Solar Technician' },
]

function FindServiceBtn() {
  const router = useRouter()
  const { service, setService } = useServiceContext();

   const handleFindClick = () => {
    if (!service) {
      toast.warning('Please select a service first.')
      return
    }

    router.push('/process')
  }

  return (
    <div className="p-1.5 backdrop-blur-xl bg-[#ffe3d7] flex gap-1.5 justify-center rounded-3xl">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='outline-none rounded-3xl flex items-center justify-center bg-[#db4b0d]'>
            Services <PiGearSixDuotone />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {services.map((ser, idx) => (
            <DropdownMenuItem key={idx} 
            onClick={() => { setService(ser.value);
  }}>
              {ser.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant={'outline'} className='outline-none rounded-3xl flex items-center justify-center border-1 border-[#db4b0d] text-[#db4b0d] bg-[#fdfdfd]' onClick={handleFindClick}>
        Find <FaMagnifyingGlass />
      </Button>
    </div>
  )
}

export default FindServiceBtn
