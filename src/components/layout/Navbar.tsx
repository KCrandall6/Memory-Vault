// src/components/layout/Navbar.tsx
import { Link } from 'react-router-dom';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

const Navbar = () => {
  return (
    <nav className="bg-vault-blue text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/path-to-your-logo.png" alt="Memory Vault" className="h-10" />
          <span className="text-xl font-bold">Memory Vault</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/upload" className="px-4 py-2 hover:bg-vault-blue-dark rounded">
            Upload
          </Link>
          <Link to="/search" className="px-4 py-2 hover:bg-vault-blue-dark rounded">
            Search
          </Link>
          
          <Menu as="div" className="relative">
            <MenuButton className="p-2 hover:bg-vault-blue-dark rounded">
              <span>More</span>
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded-md p-1">
              <MenuItem>
                {({ active }) => (
                  <Link 
                    to="/help" 
                    className={`block px-4 py-2 rounded ${active ? 'bg-vault-blue text-white' : ''}`}
                  >
                    Help
                  </Link>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <Link 
                    to="/about" 
                    className={`block px-4 py-2 rounded ${active ? 'bg-vault-blue text-white' : ''}`}
                  >
                    About
                  </Link>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;