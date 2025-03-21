import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import MinutesBox from "../components/MinutesBox";
import TranscriptBox from "../components/TranscriptBox";
import ChatBox from "../components/ChatBox";
import styles from "./MinutesFrame.module.css";
import { getLastJobData, joinJobRoom } from "../api/apiService";
import { useNavigate } from "react-router-dom";
// Default action points to display before any audio file is uploaded
const DEFAULT_ACTION_POINTS = [
    "Finalize design modifications for the Ford car concept (light, bumper, and wheel adjustments).",
    "Have Ches develop a portfolio of car designs inspired by Lamborghini models.",
    "Align marketing strategies between Ches, Envisage, and Caton to target high-net-worth clients.",
    "Consult with Nick regarding repositioning Caton as a bespoke car brand.",
    "Organize presentation training for Charlotte to ensure consistent fonts and layout.",
    "Adjust Adobe Express/PowerPoint templates to standardize text size, formatting, and design elements.",
    "Address and resolve calendar sharing and permission issues among team members.",
];
// Create default data structure that matches expected format
const DEFAULT_JOB_DATA = {
    status: "completed",
    minutes: {
        action_items: DEFAULT_ACTION_POINTS.map((text, index) => ({
            id: `default-${index}`,
            text,
            done: false
        })),
        summary: "Default meeting summary - upload an audio file to generate real minutes.",
        key_points: ["Default key point - upload an audio file to generate real meeting insights."],
        transcription: "",
        speakers: []
    }
};
const MinutesFrame = () => {
    var _a, _b;
    const navigate = useNavigate();
    const [leftWidth, setLeftWidth] = useState(50); // Initial width percentage for the left container
    const [isRightCollapsed, setIsRightCollapsed] = useState(true);
    const [activeJobId, setActiveJobId] = useState(null);
    // Initialize with default job data
    const [jobData, setJobData] = useState(DEFAULT_JOB_DATA);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // Enhanced useEffect to retrieve data and set up socket listeners
    useEffect(() => {
        // First try to get data from localStorage
        const { jobId, jobData: storedJobData } = getLastJobData();
        if (jobId) {
            setActiveJobId(jobId);
            console.log(`Retrieved job ID from localStorage: ${jobId}`);
            if (storedJobData) {
                // Only override defaults if we have real data
                if (storedJobData.minutes && storedJobData.status === "completed") {
                    setJobData(storedJobData);
                    console.log('Retrieved job data from localStorage');
                }
            }
            else {
                // If we have a job ID but no data, try to fetch it
                setLoading(true);
                fetch(`http://localhost:5000/job_status/${jobId}`)
                    .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch job data');
                    }
                    return response.json();
                })
                    .then(data => {
                    console.log('Fetched job data:', data);
                    if (data.status === 'completed' && data.minutes) {
                        setJobData(data);
                        // Also store in localStorage for better persistence
                        try {
                            localStorage.setItem('lastJobData', JSON.stringify(data));
                        }
                        catch (e) {
                            console.error('Error storing job data in localStorage:', e);
                        }
                    }
                    else if (data.status === 'error') {
                        setError(`Error: ${data.error || 'Unknown error'}`);
                    }
                })
                    .catch(err => {
                    console.error('Error fetching job data:', err);
                    setError('Failed to load job data. Please try again.');
                })
                    .finally(() => {
                    setLoading(false);
                });
            }
            // Set up socket listeners for this job
            const cleanup = joinJobRoom(jobId, (updateData) => {
                // Handle processing updates
                console.log('Processing update:', updateData);
            }, (completeData) => {
                // Handle processing complete
                console.log('Processing complete:', completeData);
                setJobData(completeData);
                // Store in localStorage
                try {
                    localStorage.setItem('lastJobData', JSON.stringify(completeData));
                }
                catch (e) {
                    console.error('Error storing job data in localStorage:', e);
                }
            });
            // Clean up socket listeners when component unmounts
            return cleanup;
        }
    }, []);
    const handleMouseDown = (e) => {
        const startX = e.clientX;
        const startLeftWidth = leftWidth;
        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const newLeftWidth = Math.min(Math.max(startLeftWidth + deltaX / window.innerWidth * 100, 10), 90);
            setLeftWidth(newLeftWidth);
        };
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };
    const handleChatCollapseChange = (collapsed) => {
        setIsRightCollapsed(collapsed);
    };
    const handleNewJobCreated = (jobId, data) => {
        console.log('New job created:', jobId, 'with data:', data);
        setActiveJobId(jobId);
        setError(null);
        if (data && data.minutes) {
            setJobData(data);
            console.log('Setting job data:', data);
            try {
                localStorage.setItem('lastJobData', JSON.stringify(data));
            }
            catch (e) {
                console.error('Error storing job data in localStorage:', e);
            }
        }
        localStorage.setItem('lastJobId', jobId);
        return joinJobRoom(jobId, (updateData) => {
            console.log('Processing update:', updateData);
        }, (completeData) => {
            console.log('Processing complete:', completeData);
            setJobData(completeData);
            try {
                localStorage.setItem('lastJobData', JSON.stringify(completeData));
            }
            catch (e) {
                console.error('Error storing job data in localStorage:', e);
            }
        });
    };
    // Navigation function to MeetingsFrame
    const handleNavigateToMeetings = () => {
        navigate("/meetings");
    };
    // Add a new handler for logout functionality
    const handleLogout = () => {
        console.log("Logout button clicked in MinutesFrame");
        // Clear any necessary session data
        localStorage.removeItem('lastJobId');
        localStorage.removeItem('lastJobData');
        // Navigate to login page
        navigate("/");
    };
    console.log("Current job data:", jobData); // Add this to debug the data being passed
    return (_jsxs("div", { className: styles.minutesFrame, children: [_jsx(NavBar, { onNewJobCreated: handleNewJobCreated, onArrowClick: handleNavigateToMeetings }), loading && (_jsxs("div", { className: styles.loadingOverlay, children: [_jsx("div", { className: styles.loadingSpinner }), _jsx("div", { className: styles.loadingText, children: "Loading job data..." })] })), error && (_jsxs("div", { className: styles.errorBanner, children: [error, _jsx("button", { className: styles.dismissButton, onClick: () => setError(null), children: "\u2715" })] })), _jsxs("div", { className: styles.mainContent, children: [_jsxs("div", { className: styles.leftContainer, style: { width: `${leftWidth}%` }, children: [_jsx(MinutesBox, { property1: "Expanded", jobId: activeJobId, jobData: jobData }), _jsx(TranscriptBox, { property1: "Expanded", jobId: activeJobId, transcription: (_a = jobData === null || jobData === void 0 ? void 0 : jobData.minutes) === null || _a === void 0 ? void 0 : _a.transcription, speakers: (_b = jobData === null || jobData === void 0 ? void 0 : jobData.minutes) === null || _b === void 0 ? void 0 : _b.speakers }), _jsx("div", { className: styles.transparentFrame })] }), !isRightCollapsed ? (_jsx("div", { className: styles.resizer, onMouseDown: handleMouseDown })) : (_jsx("div", { className: styles.spacer })), _jsx("div", { className: styles.rightContainer, style: isRightCollapsed ? { width: '50px' } : { width: `${100 - leftWidth}%` }, "data-collapsed": isRightCollapsed, children: _jsx(ChatBox, { collapsed: false, className: styles.chatBox, onCollapseChange: handleChatCollapseChange }) })] })] }));
};
export default MinutesFrame;
