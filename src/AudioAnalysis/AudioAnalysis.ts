import React from 'react'
import { useState, useEffect } from 'react';
import apiClient from '../spotifyAPI';
import { calculateAverages } from './AudioAverages';

export const analyzeFeatures = (data) => {
    // console.log(data)
    const avgs = calculateAverages(data)
    // console.log(avgs)
}