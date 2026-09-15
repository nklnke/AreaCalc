// ===== СКЕЛЕТОН ЗАГРУЗКИ =====
window.Skeleton = (function() {
    let historySkeleton = null;
    let historyList = null;
    let totalDisplay = null;
    
    function init() {
        historySkeleton = document.getElementById('historySkeleton');
        historyList = document.getElementById('historyList');
        totalDisplay = document.getElementById('totalDisplay');
    }
    
    function show() {
        if (historySkeleton) historySkeleton.style.display = 'flex';
        if (historyList) historyList.style.display = 'none';
        if (totalDisplay) totalDisplay.style.visibility = 'hidden';
    }
    
    function hide() {
        if (historySkeleton) historySkeleton.style.display = 'none';
        if (historyList) historyList.style.display = 'block';
        if (totalDisplay) totalDisplay.style.visibility = 'visible';
    }
    
    return {
        init,
        show,
        hide
    };
})();
