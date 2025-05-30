document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-buttons a');
    const sections = ['information', 'signal', 'rele'];

    let intervals = {
        information: null,
        signal: null,
        rele: null
    };

    let timeUpdateInterval = null;
    let lastDeviceTime = null;
    let lastUptime = null;
    let lastSyncTimestamp = null;

    const fetchHandlers = {
        information: () => {
            fetchData();
            intervals.information = setInterval(fetchData, 5000);
        },
        signal: () => {
            updateDiDo();
            intervals.signal = setInterval(updateDiDo, 5000);
        },
        rele: () => {
            updateRelays();
            intervals.rele = setInterval(updateRelays, 5000);
        }
    };

    const clearAllIntervals = () => {
        Object.entries(intervals).forEach(([key, id]) => {
            if (id) clearInterval(id);
            intervals[key] = null;
        });
    };

    const manageRefresh = (section) => {
        clearAllIntervals();
        if (fetchHandlers[section]) fetchHandlers[section]();
    };

    const switchSection = (event) => {
        event.preventDefault();
        const sectionId = event.currentTarget.dataset.section;

        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.content section').forEach(section => {
            section.classList.remove('active');
        });

        event.currentTarget.classList.add('active');
        document.getElementById(sectionId).classList.add('active');

        manageRefresh(sectionId);
    };

    navLinks.forEach(link => link.addEventListener('click', switchSection));

    // ======================== DATA ========================
    const fetchData = async () => {
        try {
            const response = await fetch('/cgi-bin/data_api.sh?r=' + Date.now());
            if (!response.ok) throw new Error('������ ����');
            const data = await response.json();

            // ����������: �������� � aside � title
            const rawModel = data.Model || '��� �����';
            const shortModel = rawModel.length > 20 ? rawModel.slice(0, 20) + '�' : rawModel;
            document.title = `${shortModel}`;

            const nameSpan = document.querySelector('.device-name');
            if (nameSpan) nameSpan.textContent = shortModel;

            if (document.getElementById('information').classList.contains('active')) {
                document.getElementById('Manufacturer').textContent = data.Manufacturer || '-';
                document.getElementById('Model').textContent = data.Model || '-';
                document.getElementById('IP-Address').textContent = data['IP-Address'] || '-';

                lastDeviceTime = parseDeviceTime(data.Time);
                lastUptime = parseFloat(data.UPtime);
                lastSyncTimestamp = Date.now();

                document.getElementById('Time').textContent = data.Time || '-';
                document.getElementById('UPtime').textContent = formatUptime(data.UPtime) || '-';
                document.getElementById('STARTtime').textContent = calcStartTime(data.Time, data.UPtime) || '-';

                startTimeUpdater();
                fillCurrentSettings(data['IP-Address'], cidrToMask(data.Netmask));
            }
        } catch (error) {
            console.error('������:', error);
        }
    };

    const updateDiDo = async () => {
        if (!document.getElementById('signal').classList.contains('active')) return;

        try {
            const response = await fetch('/cgi-bin/di_do_api.sh?r=' + Date.now());
            const data = await response.json();

            document.querySelectorAll('#di-do-body tr').forEach(row => {
                const key = row.dataset.key;
                const entry = data[key];
                if (entry) {
                    const statusCell = row.querySelector('.status');
                    const valueCell = row.querySelector('.value');
                    statusCell.textContent = entry.value === '0' ? 'ON' : 'OFF';
                    statusCell.className = `status${entry.value === '0' ? ' active' : ''}`;
                    valueCell.textContent = `${entry.path}: ${entry.value}`;
                }
            });
        } catch (error) {
            console.error('DI/DO Error:', error);
        }
    };

    const updateRelays = async () => {
        if (!document.getElementById('rele').classList.contains('active')) return;

        try {
            const response = await fetch('/cgi-bin/relay_api.sh?r=' + Date.now());
            const data = await response.json();

            document.querySelectorAll('#relay-body tr').forEach(row => {
                const key = row.dataset.key;
                const entry = data[key];
                if (entry) {
                    const statusCell = row.querySelector('.status');
                    const valueCell = row.querySelector('.value');
                    statusCell.textContent = entry.value === '1' ? 'ON' : 'OFF';
                    statusCell.className = `status${entry.value === '1' ? ' active' : ''}`;
                    valueCell.textContent = `${entry.path}: ${entry.value}`;
                }
            });
        } catch (error) {
            console.error('Relay Error:', error);
        }
    };

    // =================== TIME HANDLER ===================
    const startTimeUpdater = () => {
        if (timeUpdateInterval) clearInterval(timeUpdateInterval);
        timeUpdateInterval = setInterval(() => {
            if (!lastDeviceTime || !lastUptime || !lastSyncTimestamp) return;
            const now = Date.now();
            const elapsed = Math.floor((now - lastSyncTimestamp) / 1000);

            const updatedTime = new Date(lastDeviceTime.getTime() + elapsed * 1000);
            const updatedUptime = parseFloat(lastUptime) + elapsed;

            document.getElementById('Time').textContent =
                updatedTime.toLocaleTimeString('ru-RU') + ' ' + updatedTime.toLocaleDateString('ru-RU');
            document.getElementById('UPtime').textContent = formatUptime(updatedUptime);
            document.getElementById('STARTtime').textContent = calcStartTime(
                updatedTime.toLocaleTimeString('ru-RU') + ' ' + updatedTime.toLocaleDateString('ru-RU'),
                updatedUptime
            );
        }, 1000);
    };

    // =================== HELPERS ===================
    const parseDeviceTime = (str) => {
        const [timePart, datePart] = str.split(' ');
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        const [day, month, year] = datePart.split('.').map(Number);
        return new Date(year, month - 1, day, hours, minutes, seconds);
    };

    const formatUptime = (seconds) => {
        seconds = parseInt(seconds);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${d}д ${h}ч ${m}м ${s}с`;
    };

    const calcStartTime = (currentTimeStr, uptimeSecondsStr) => {
        const [timePart, datePart] = currentTimeStr.split(' ');
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        const [day, month, year] = datePart.split('.').map(Number);
        const currentDate = new Date(year, month - 1, day, hours, minutes, seconds);
        const uptimeSeconds = parseFloat(uptimeSecondsStr);
        const startDate = new Date(currentDate.getTime() - uptimeSeconds * 1000);
        return startDate.toLocaleTimeString('ru-RU') + ' ' + startDate.toLocaleDateString('ru-RU');
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

    // =================== INPUT HANDLERS ===================
    document.querySelectorAll('.ip-input').forEach(input => {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value > 255) this.value = '255';
            if (this.value.length === 3) {
                const next = this.parentElement.querySelector(`input:nth-child(${Array.from(this.parentElement.children).indexOf(this) + 2}`);
                next?.focus();
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && this.value.length === 0) {
                const prev = this.parentElement.querySelector(`input:nth-child(${Array.from(this.parentElement.children).indexOf(this) - 2}`);
                prev?.focus();
            }
        });
    });

    document.getElementById('saveSettings').addEventListener('click', async () => {
        const ip = [1, 2, 3, 4].map(i => document.getElementById(`ip${i}`).value).join('.');
        const mask = [1, 2, 3, 4].map(i => document.getElementById(`mask${i}`).value).join('.');
        
        if (!validateIP(ip)) return alert('Неверный IP-адрес');
        if (!validateIP(mask)) return alert('Неверная маска подсети');
        
        try {
            const response = await fetch('/cgi-bin/apply_network.sh', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ip: ip,
                    mask: mask // Конвертация в CIDR формат
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Обновление текущих настроек на интерфейсе
                document.getElementById('IP-Address').textContent = ip;
                fillCurrentSettings(ip, mask);
                alert(`Настройки сохранены в файл: ${result.filename}`);
            } else {
                alert(`Ошибка: ${result.message}`);
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка соединения с сервером');
        }
    });

    // Функция конвертации маски в CIDR
    const maskToCidr = (mask) => {
        return mask.split('.')
            .map(octet => (255 - parseInt(octet)).toString(2))
            .join('')
            .indexOf('1');
    };

    // Обновлённая функция fillCurrentSettings
    const fillCurrentSettings = (ip, mask) => {
        if (!ip || !mask) return;
        const ipParts = ip.split('.');
        const maskParts = mask.split('.');
        
        ipParts.forEach((part, i) => {
            const element = document.getElementById(`ip${i + 1}`);
            if (element) element.value = part;
        });
        
        maskParts.forEach((part, i) => {
            const element = document.getElementById(`mask${i + 1}`);
            if (element) element.value = part;
        });
    };

    const validateIP = (ip) => {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
    };

    // ===== Инициализация по умолчанию
    manageRefresh('information');
});
