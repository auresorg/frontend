import React from "react";

const Faq = () => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null)
    const faqsData = [
        {
            question: 'How is Aures different from other similar tools?',
            answer: 'Most tools just build resumes. Aures manages your entire professional identity. Update your data once and it syncs to role-based resumes, custom links, posts, portfolio, and API instantly.'
        },
        {
            question: 'How do I set up Aures?',
            answer: 'Setup is simple. Sign up and start building immediately. You can also import your existing resume to speed things up and refine it instead of starting from scratch.'
        },
        {
            question: 'What happens if I face issues?',
            answer: 'If something breaks or feels unclear, reach out. Issues are taken seriously and fixed fast. Aures is actively maintained, so feedback directly improves the product.'
        },
        {
            question: 'How much does it cost, and is it worth it?',
            answer: 'Aures is currently free. If it saves you hours of manual updates and helps you present a stronger, always up-to-date profile, it is easily worth it.'
        },
        {
            question: 'What should I do if I face a "GitHub email ID needs to be public" error?',
            answer: 'This happens because GitHub hides your email by default. Go to GitHub Settings → Emails and make sure your primary email is verified and public. If you prefer privacy, you can enable the GitHub-provided no-reply email and use that instead.'
        }
    ]
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

                * {
                    font-family: 'Poppins', sans-serif;
                }
            `}</style>
            <div className='flex flex-col items-center text-center text-slate-800 px-3'>
                <p className='text-base font-medium text-slate-600'>FAQ</p>
                <h1 className='text-3xl md:text-4xl font-semibold mt-2'>Frequently Asked Questions</h1>
                <p className='text-sm text-slate-500 mt-4 max-w-md'>
                    Here are some of our FAQs. If you have any other quesitons in mind, please feel free to email us.
                </p>
                <div className='max-w-xl w-full mt-6 flex flex-col gap-4 items-start text-left'>
                    {faqsData.map((faq, index) => (
                        <div key={index} className='flex flex-col items-start w-full'>
                            <div className='flex items-center justify-between w-full cursor-pointer border border-indigo-100 p-4 rounded' onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                                <h2 className='text-sm'>{faq.question}</h2>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${openIndex === index ? "rotate-180" : ""} transition-all duration-500 ease-in-out`}>
                                    <path d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2" stroke="#1D293D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className={`text-sm text-slate-500 px-4 transition-all duration-500 ease-in-out ${openIndex === index ? "opacity-100 max-h-[300px] translate-y-0 pt-4" : "opacity-0 max-h-0 -translate-y-2"}`} >
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default Faq;