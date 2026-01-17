import React from 'react';
import { Outlet } from 'react-router-dom';
import LayoutWrapper from '../theme/tailadmin/layout/LayoutWrapper';

function Layout() {
    return (
        <LayoutWrapper>
            <Outlet />
        </LayoutWrapper>
    );
}

export default Layout;
