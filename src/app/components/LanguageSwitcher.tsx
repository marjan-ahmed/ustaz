'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'EN', label: 'English' },
  { code: 'UR', label: 'Urdu' },
  { code: 'AR', label: 'Arabic' },
];

export default function LanguageSwitcher() {
  const [selectedLang, setSelectedLang] = useState('EN');

  const handleLanguageChange = (code: string) => {
    setSelectedLang(code);
    // Optional: Add your language switching logic here (i18n or routing)
  };

  return (
    <div className="w-full flex justify-start sm:justify-center ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="text-sm sm:text-base"
          >
            <Globe className="w-4 h-4" />
            {selectedLang}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32 text-sm">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="cursor-pointer"
            >
              {lang.code}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
