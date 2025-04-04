import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import '../styles/TopicPresentation.css'; 
import { Helmet, HelmetProvider } from 'react-helmet-async';
import HeadLinks from '../components/HeadLinks';


const TopicPresentation = () => {
  const [topic, setTopic] = useState(null);
  const { id } = useParams();
  const { municipalityId } = useParams();
  const token = localStorage.getItem("jwtToken");
  const navigate = useNavigate();
  

const fetchPresenterTopic = useCallback(async () => {
  try {
    const endpoint = `${process.env.REACT_APP_API_URL}/api/sessions/${id}/topics/presenter`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch topic. Status: ${response.status}`);
      return;
    }

    const text = await response.text();
    if (!text) {
      console.warn("Empty response body received.");
      return;
    }

    const data = JSON.parse(text);
    console.log("Fetched topic:", data);
    setTopic(data);
  } catch (error) {
    console.error("Error fetching topic:", error);
  }
}, [id, token]);


  useEffect(() => {
    fetchPresenterTopic();
  }, [fetchPresenterTopic]);

  useEffect(() => {
    const intervalId = setInterval(fetchPresenterTopic, 1500);
    return () => clearInterval(intervalId);
  }, [fetchPresenterTopic]);

  return (
    <div className="topic-presentar-container p-4">
    <HelmetProvider>
      <Helmet>
        <title>Презентација</title>
      </Helmet>
    </HelmetProvider>
    <HeadLinks />

     <div className="presenter-header">
      <img
        id="logo-img"
        src={`${process.env.PUBLIC_URL}/images/grb.png`}
        className="logo-img-presenter"
        alt="Logo"
        onClick={() => window.location.reload()} 
      />
      <button 
        className="back-button-presenter"
        onClick={() => navigate(`/municipalities/${municipalityId}/sessions#session-${id}`)}
      >
        Назад
      </button>
    </div>
    {!topic ? (
      <h1 className="text-center">Нема презентирачка точка</h1>
    ) : (
      <>
        {/* Dynamic styles based on topicStatus */}
        <div className={`topic-presentar-container p-4 ${ 
          topic.topicStatus === 'FINISHED' || 
          topic.topicStatus === 'WITHDRAWN' || 
          topic.topicStatus === 'INFORMATION' ? 'finished-topic' : ''} 
          ${topic.topicStatus === 'ACTIVE' ? 'active-topic' : ''} 
        `}>
          <h1 className="presented-topic-header">{topic.title}</h1>

          <div className="presented-topic-body">
            <div className="presented-topic-body-div">
              <p className="presented-text">За</p>
              <h1 className="presented-number yes">{topic.yes}</h1>
            </div>
            <div className="presented-topic-body-div">
              <p className="presented-text">Против</p>
              <h1 className="presented-number no">{topic.no}</h1>
            </div>
            <div className="presented-topic-body-div">
              <p className="presented-text">Воздржан</p>
              <h1 className="presented-number abstained">{topic.abstained}</h1>
            </div>
            <div className="presented-topic-body-div">
              <p className="presented-text">Се иземува</p>
              <h1 className="presented-number cant-vote">{topic.cantVote}</h1>
            </div>
            <div className="presented-topic-body-div">
              <p className="presented-text">Не гласале</p>
              <h1 className="presented-number havent-vote">{topic.haveNotVoted}</h1>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
  );
};

export default TopicPresentation;
