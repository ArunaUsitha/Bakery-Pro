import React from "react";

const Table = ({ children, className = "" }) => {
    return (
        <div className="overflow-x-auto">
            <table className={`min-w-full divide-y divide-gray-200 dark:divide-white/[0.05] ${className}`}>
                {children}
            </table>
        </div>
    );
};

const TableHeader = ({ children, className = "" }) => {
    return <thead className={`bg-gray-50 dark:bg-gray-800/50 ${className}`}>{children}</thead>;
};

const TableBody = ({ children, className = "" }) => {
    return <tbody className={`divide-y divide-gray-200 dark:divide-white/[0.05] ${className}`}>{children}</tbody>;
};

const TableRow = ({ children, className = "" }) => {
    return <tr className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${className}`}>{children}</tr>;
};

const TableCell = ({
    children,
    isHeader = false,
    className = "",
}) => {
    const CellTag = isHeader ? "th" : "td";
    const baseStyles = isHeader
        ? "px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
        : "px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap";

    return <CellTag className={`${baseStyles} ${className}`}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };

