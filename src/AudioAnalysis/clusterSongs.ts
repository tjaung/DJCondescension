import kmeans from "../utils/kmeans";
import { pickRandomNSongs } from "../utils/utils";

export const clusterSongs = (songList, k = 3) => {
    const features = songList.map(song => song.audioFeatures)
    // Prepare the data to be clustered (use relevant audio features)
    const data = songList.map(song => [
        song.audioFeatures.acousticness,
        song.audioFeatures.danceability,
        song.audioFeatures.energy,
        song.audioFeatures.valence,
        song.audioFeatures.tempo,
    ]);

    // Run the clustering
    const { clusters, centroids, iterations, converged } = kmeans(data, k);
    
    // Create a nested list of track IDs for each cluster
    const clusterTrackIds = clusters.map(cluster => 
        cluster.indexes.map(i => songList[i].id)
    );

    // randomly select one of the clusters
    let chosenSongGroup = pickRandomNSongs(1, clusterTrackIds)
    // make sure its length is 5 or less
    if(chosenSongGroup.length > 5) {
        const shortenedArray = chosenSongGroup.slice(0, 5);
        return shortenedArray
    }
    return chosenSongGroup

    // Output cluster information
    // clusters.forEach((cluster, index) => {
    //     console.log(`Cluster ${index}:`);
    //     cluster.indexes.forEach(i => {
    //         console.log(`  - Track: ${songList[i].name}, Artist: ${songList[i].artists.map(artist => artist.name).join(', ')}`);
    //     });
    // });
};