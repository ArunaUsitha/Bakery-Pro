import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    GridIcon,
    CalenderIcon,
    BoxCubeIcon,
    ListIcon,
    TableIcon,
    PageIcon,
    PieChartIcon,
    HorizontaLDots,
    ChevronDownIcon,
    UserCircleIcon,
    BoxIcon,
    TaskIcon,
    BoltIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../../../context/AuthContext";

const navItems = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/",
    },
    {
        icon: <BoltIcon />,
        name: "Production",
        path: "/production",
    },
    {
        icon: <BoxIcon />,
        name: "Inventory",
        path: "/inventory",
    },
    {
        icon: <TaskIcon />,
        name: "Sales",
        path: "/sales",
    },
    {
        icon: <PageIcon />,
        name: "Vehicle Settlement",
        path: "/settlements",
    },
    {
        icon: <CalenderIcon />,
        name: "Shop Settlement",
        path: "/shop-settlements",
    }
];

const managementItems = [
    {
        icon: <BoxCubeIcon />,
        name: "Products",
        path: "/products",
        roles: ['admin', 'manager']
    },
    {
        icon: <ListIcon />,
        name: "Ingredients",
        path: "/ingredients",
        roles: ['admin', 'manager']
    },
    {
        icon: <CalenderIcon />,
        name: "Recipes",
        path: "/recipes",
        roles: ['admin', 'manager']
    },
    {
        icon: <TableIcon />,
        name: "Base Preparations",
        path: "/base-preparations",
        roles: ['admin', 'manager']
    }
];

const othersItems = [
    {
        icon: <PieChartIcon />,
        name: "Reports",
        path: "/reports",
        roles: ['admin']
    },
    {
        icon: <UserCircleIcon />, // Using waste icon substitute
        name: "Wastage",
        path: "/wastage",
    },
    {
        icon: <HorizontaLDots />,
        name: "Settings",
        path: "/settings",
        roles: ['admin']
    }
];

const Sidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const location = useLocation();
    const { user } = useAuth();
    const userRoles = user?.roles?.map(r => r.name) || [];

    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [subMenuHeight, setSubMenuHeight] = useState({});
    const subMenuRefs = useRef({});

    const isActive = useCallback(
        (path) => location.pathname === path,
        [location.pathname]
    );

    const filterItems = (items) => {
        return items.filter(item => !item.roles || item.roles.some(role => userRoles.includes(role)));
    };

    const filteredNavItems = filterItems(navItems);
    const filteredManagementItems = filterItems(managementItems);
    const filteredOthersItems = filterItems(othersItems);

    useEffect(() => {
        // Logic for auto-opening submenus if needed
    }, [location, isActive]);

    const handleSubmenuToggle = (index, menuType) => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (
                prevOpenSubmenu &&
                prevOpenSubmenu.type === menuType &&
                prevOpenSubmenu.index === index
            ) {
                return null;
            }
            return { type: menuType, index };
        });
    };

    const renderMenuItems = (items, menuType) => (
        <ul className="flex flex-col gap-4">
            {items.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                ? "menu-item-active"
                                : "menu-item-inactive"
                                } cursor-pointer ${!isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "lg:justify-start"
                                }`}
                        >
                            <span
                                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "menu-item-icon-active"
                                    : "menu-item-icon-inactive"
                                    }`}
                            >
                                {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <span className="menu-item-text">{nav.name}</span>
                            )}
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <ChevronDownIcon
                                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                                        openSubmenu?.index === index
                                        ? "rotate-180 text-brand-500"
                                        : ""
                                        }`}
                                />
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                to={nav.path}
                                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                                    }`}
                            >
                                <span
                                    className={`menu-item-icon-size ${isActive(nav.path)
                                        ? "menu-item-icon-active"
                                        : "menu-item-icon-inactive"
                                        }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">{nav.name}</span>
                                )}
                            </Link>
                        )
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
                    ? "w-[290px]"
                    : isHovered
                        ? "w-[290px]"
                        : "w-[90px]"
                }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
            >
                <Link to="/">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <BoltIcon size={24} />
                        </div>
                        {(isExpanded || isHovered || isMobileOpen) && (
                            <h1 className="text-gray-900 dark:text-white uppercase text-xl font-bold">Bakery <span className="font-medium text-brand-500">Pro</span></h1>
                        )}
                    </div>
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "justify-start"
                                    }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    "Main Menu"
                                ) : (
                                    <HorizontaLDots className="size-6" />
                                )}
                            </h2>
                            {renderMenuItems(filteredNavItems, "main")}
                        </div>

                        {filteredManagementItems.length > 0 && (
                            <div>
                                <h2
                                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "justify-start"
                                        }`}
                                >
                                    {isExpanded || isHovered || isMobileOpen ? (
                                        "Management"
                                    ) : (
                                        <HorizontaLDots className="size-6" />
                                    )}
                                </h2>
                                {renderMenuItems(filteredManagementItems, "management")}
                            </div>
                        )}

                        <div>
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "justify-start"
                                    }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    "Others"
                                ) : (
                                    <HorizontaLDots />
                                )}
                            </h2>
                            {renderMenuItems(filteredOthersItems, "others")}
                        </div>
                    </div>
                </nav>
                {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
            </div>
        </aside>
    );
};

export default Sidebar;
