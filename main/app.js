document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-buttons a');
    let refreshInterval = null;

    const manageRefresh = (section) => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        if (section === 'information') {
            fetchData();
            refreshInterval = setInterval(fetchData, 5000);
        }
    };

    function switchSection(event) {
        event.preventDefault();
        const sectionId = this.dataset.section;

        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.content section').forEach(section => {
            section.classList.remove('active');
        });

        this.classList.add('active');
        document.getElementById(sectionId).classList.add('active');

        manageRefresh(sectionId);
    }

    navLinks.forEach(link => link.addEventListener('click', switchSection));

    const fillCurrentSettings = (ip, mask) => {
        if (!ip || !mask) return;
        const ipParts = ip.split('.');
        const maskParts = mask.split('.');
        
        ipParts.forEach((part, i) => {
            const element = document.getElementById(`ip${i+1}`);
            if (element) element.value = part;
        });
        
        maskParts.forEach((part, i) => {
            const element = document.getElementById(`mask${i+1}`);
            if (element) element.value = part;
        });
    };

    const cidrToMask = (cidr) => {
        cidr = parseInt(cidr, 10);
        const mask = [];
        for (let i = 0; i < 4; i++) {
            const bits = Math.min(8, cidr);
            mask.push(256 - Math.pow(2, 8 - bits));
            cidr -= bits;
        }
        return mask.join('.');
    };

    const fetchData = async () => {
        try {
            const response = await fetch('/cgi-bin/data_api.sh?r=' + Math.random());
            if (!response.ok) throw new Error('Ошибка сети');
            const data = await response.json();

            if (document.getElementById('information').classList.contains('active')) {
                document.getElementById('Manufacturer').textContent = data.Manufacturer || '-';
                document.getElementById('Model').textContent = data.Model || '-';
                document.getElementById('IP-Address').textContent = data['IP-Address'] || '-';
                document.getElementById('MAC-Address').textContent = data['MAC-Address'] || '-';
                document.getElementById('STARTtime').textContent = data.STARTtime || '-';
                document.getElementById('UPtime').textContent = data.UPtime || '-';
                document.getElementById('Time').textContent = data.Time || '-';
                document.getElementById('CPU').textContent = data.CPU || '-';
                document.getElementById('RAM').textContent = data.RAM || '-';
            }

            fillCurrentSettings(data['IP-Address'], cidrToMask(data.Netmask));
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    manageRefresh('information');
});

document.querySelectorAll('.ip-input').forEach(input => {
    input.addEventListener('input', function(e) {

        this.value = this.value.replace(/[^0-9]/g, '');

        if(this.value > 255) this.value = 255;

        if(this.value.length === 3) {
            const next = this.parentElement.querySelector(`input:nth-child(${Array.from(this.parentElement.children).indexOf(this) + 2}`);
            next?.focus();
        }
    });

    input.addEventListener('keydown', function(e) {
        if(e.key === 'Backspace' && this.value.length === 0) {
            const prev = this.parentElement.querySelector(`input:nth-child(${Array.from(this.parentElement.children).indexOf(this) - 2}`);
            prev?.focus();
        }
    });
});

document.getElementById('saveSettings').addEventListener('click', async () => {
    const ip = [
        document.getElementById('ip1').value,
        document.getElementById('ip2').value,
        document.getElementById('ip3').value,
        document.getElementById('ip4').value
    ].join('.');

    const mask = [
        document.getElementById('mask1').value,
        document.getElementById('mask2').value,
        document.getElementById('mask3').value,
        document.getElementById('mask4').value
    ].join('.');

    if (!validateIP(ip)) return alert('Неверный IP-адрес');
    if (!validateIP(mask)) return alert('Неверная маска подсети');

    try {
        const response = await fetch('/cgi-bin/apply_network.sh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, mask })
        });

        if (!response.ok) throw new Error(await response.text());

        setTimeout(() => {
            window.location.href = `http://${ip}/index.htm`;
        }, 5000);

        alert('Настройки применены. Вы будете перенаправлены через 5 секунд.');

    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
});

function validateIP(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}
