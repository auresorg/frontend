import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import StatsDisplay from "./StatsDisplay";

export const revalidate = 0; // Disable static rendering for this page
export const dynamic = "force-dynamic";

export default async function StatsPage({
    searchParams,
}: {
    searchParams: { pwd?: string };
}) {
    // Basic password protection
    const HARDCODED_PASSWORD = "CHANGE_ME_LATER"; // Easily changable

    if (searchParams.pwd !== HARDCODED_PASSWORD) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl">
                    <h1 className="text-2xl font-bold mb-6 text-center text-white">
                        Access Restricted
                    </h1>
                    <form
                        action={async (formData) => {
                            "use server";
                            const pwd = formData.get("password");
                            // Simply redirect with the password in the URL so it's easily shareable/bookmarkable
                            redirect(`/stats?pwd=${pwd}`);
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div>
                            <label className="text-sm font-medium text-neutral-400 mb-1 block">
                                Enter Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full flex h-10 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="•••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-white text-black font-semibold h-10 rounded-md hover:bg-neutral-200 transition-colors"
                        >
                            View Statistics
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Fast Single-Value Queries for Statistics
    // Using Parallel queries for maximum SSR speed
    const [
        usersResult,
        projectsResult,
        experiencesResult,
        certificationsResult,
        awardsResult,
        educationsResult,
        resumesResult,
        usersListResult,
        schoolsListResult,
        certsListResult,
        experiencesListResult,
    ] = await Promise.all([
        query<{ count: string }>("SELECT count(*) FROM users"),
        query<{ count: string }>("SELECT count(*) FROM project"),
        query<{ count: string }>("SELECT count(*) FROM experience"),
        query<{ count: string }>("SELECT count(*) FROM certification"),
        query<{ count: string }>("SELECT count(*) FROM award"),
        query<{ count: string }>("SELECT count(*) FROM education"),
        query<{ count: string }>("SELECT count(*) FROM resumes"),
        query<{ username: string; firstname: string; lastname: string }>(
            'SELECT username, "firstname" AS "firstname", "lastname" AS "lastname" FROM users'
        ).catch(() => query<{ username: string; firstname: string; lastname: string }>('SELECT username, firstname, lastname FROM users')),
        query<{ school: string }>(
            "SELECT DISTINCT school FROM education WHERE school IS NOT NULL AND school != ''"
        ),
        query<{ title: string }>(
            "SELECT DISTINCT title FROM certification WHERE title IS NOT NULL AND title != ''"
        ),
        query<{ company: string }>(
            "SELECT DISTINCT company FROM experience WHERE company IS NOT NULL AND company != ''"
        ),
    ]);

    const stats = {
        users: parseInt(usersResult[0]?.count || "0", 10),
        projects: parseInt(projectsResult[0]?.count || "0", 10),
        experiences: parseInt(experiencesResult[0]?.count || "0", 10),
        certifications: parseInt(certificationsResult[0]?.count || "0", 10),
        awards: parseInt(awardsResult[0]?.count || "0", 10),
        educations: parseInt(educationsResult[0]?.count || "0", 10),
        resumes: parseInt(resumesResult[0]?.count || "0", 10),
        usersList: usersListResult.map((user) => ({
            username: user.username,
            // Fallbacks in case names are missing
            fullname: [user["firstname"] || user.firstname, user["lastname"] || user.lastname].filter(Boolean).join(" ") || "Unknown",
        })),
        schoolsList: schoolsListResult.map((r) => r.school),
        certsList: certsListResult.map((r) => r.title),
        experiencesList: experiencesListResult.map((r) => r.company),
    };

    return <StatsDisplay stats={stats} />;
}
