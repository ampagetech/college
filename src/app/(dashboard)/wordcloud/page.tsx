// app/news/page.tsx
import { Metadata } from "next";
import React from "react";
import GenericCloud from "@/components/common/GenericCloud";

export const metadata: Metadata = {
    title: "News Feed - Admin Dashboard",
    description: "This is the News Feed page of the Admin Dashboard",
};

const WordCloud = () => {
    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Word Cloud Visualization
            </h4>
            <GenericCloud />
        </div>
    );
};

export default WordCloud;