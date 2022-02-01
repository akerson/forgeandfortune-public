Math.seededRandom = () => {
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    return Math.seed / 233280;
}