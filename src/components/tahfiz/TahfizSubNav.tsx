"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TahfizSubMenu {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface TahfizSubNavProps {
  subMenus: TahfizSubMenu[];
  activeSubMenu: string;
  onSubMenuChange: (subMenuId: string) => void;
}

const TahfizSubNav: React.FC<TahfizSubNavProps> = ({
  subMenus,
  activeSubMenu,
  onSubMenuChange
}) => {
  return (
    <div className="w-full">
      {/* Mobile: Horizontal Scrollable Tabs */}
      <div className="flex md:hidden overflow-x-auto space-x-2 pb-2">
        {subMenus.map((menu) => (
          <Button
            key={menu.id}
            variant={activeSubMenu === menu.id ? "default" : "outline"}
            onClick={() => onSubMenuChange(menu.id)}
            className={cn(
              "flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium whitespace-nowrap",
              activeSubMenu === menu.id 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            )}
          >
            <div>{menu.icon}</div>
            <span>{menu.name}</span>
          </Button>
        ))}
      </div>

      {/* Desktop: Vertical Menu */}
      <div className="hidden md:block w-48 bg-gray-50 border-r border-gray-200 h-full">
        <div className="flex flex-col gap-2 p-2">
          {subMenus.map((menu) => (
            <Button
              key={menu.id}
              variant={activeSubMenu === menu.id ? "default" : "ghost"}
              onClick={() => onSubMenuChange(menu.id)}
              className={cn(
                "flex items-center justify-start gap-3 h-auto py-3 px-4 w-full text-left",
                activeSubMenu === menu.id 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "text-gray-800 hover:bg-gray-100"
              )}
            >
              <div>{menu.icon}</div>
              <span className="text-sm font-medium">{menu.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Active Menu for Mobile */}
      <div className="block md:hidden mt-3 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          {subMenus.find(menu => menu.id === activeSubMenu)?.icon}
          <span className="font-medium">
            {subMenus.find(menu => menu.id === activeSubMenu)?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TahfizSubNav;