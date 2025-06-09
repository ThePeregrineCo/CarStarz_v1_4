"use client";

import React from 'react';
import { SocialLink } from '../../lib/types/profiles';

interface SocialLinksProps {
  links: SocialLink[];
}

export function SocialLinks({ links }: SocialLinksProps) {
  if (!links || links.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 transition-colors"
        >
          {link.platform}
        </a>
      ))}
    </div>
  );
}