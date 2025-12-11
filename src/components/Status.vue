<template>
    <div class="rounded-container" style="margin: 25px 0;" id="domini">
        <div class="rounded-inner">
            <h2 style="margin: 0;">Stato servizi Fermi Notify <a href="//status.fn.lkev.in/" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a></h2>
            <div class="grid-center-2col" style="padding-top: 0.83em; line-height: 2; place-items: start;">
                <div class="service">
                    <div class="dot verifying" id="service-notifier" title="Verifica in corso"></div>
                    <span class="material-space-right">Invio notifiche (Notifier)</span>
                    <a href="//status.fn.lkev.in/notifier" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
                <div class="service">
                    <div class="dot verifying" id="service-notifier-backup" title="Verifica in corso"></div>
                    <span class="material-space-right">Notifier Backup</span>
                    <a href="//status.fn.lkev.in/notifier?service=backup" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
            </div>

            <div class="grid-center-2col" style="padding-top: 0.83em; line-height: 2; place-items: start;">
                <div class="domain">
                    <div class="dot verifying" id="ferminotify-me" title="Verifica in corso"></div>
                    <span class="material-space-right">ferminotify.me</span>
                    <a href="//ferminotify.me" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
                <div class="domain">
                    <div class="dot verifying" id="fn-lkev-in" title="Verifica in corso"></div>
                    <span class="material-space-right">fn.lkev.in</span>
                    <a href="//fn.lkev.in" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
                <div class="domain">
                    <div class="dot verifying" id="ferminotify-lkev-in" title="Verifica in corso"></div>
                    <span class="material-space-right">ferminotify.lkev.in</span>
                    <a href="//ferminotify.lkev.in" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
                <div class="domain">
                    <div class="dot verifying" id="ferminotify-sirico-dev" title="Verifica in corso"></div>
                    <span class="material-space-right">ferminotify.sirico.dev</span>
                    <a href="//ferminotify.sirico.dev" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
            </div>

            <div class="grid-center-2col" style="padding-top: 0.83em; line-height: 2; place-items: start;">
                <div class="domain">
                    <div class="dot verifying" id="old-ferminotify-me" title="Verifica in corso"></div>
                    <span class="material-space-right">old.ferminotify.me</span>
                    <a href="//old.ferminotify.me" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
                <div class="domain">
                    <div class="dot verifying" id="old-fn-lkev-in" title="Verifica in corso"></div>
                    <span class="material-space-right">old.fn.lkev.in</span>
                    <a href="//old.fn.lkev.in" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
            </div>

            <div class="grid-center-2col" style="padding-top: 0.83em; line-height: 2; place-items: start;">
                <div class="domain">
                    <div class="dot verifying" id="api-ferminotify-me" title="Verifica in corso"></div>
                    <span class="material-space-right">api.ferminotify.me</span>
                    <a href="//api.ferminotify.me" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
                <div class="domain">
                    <div class="dot verifying" id="api-fn-lkev-in" title="Verifica in corso"></div>
                    <span class="material-space-right">api.fn.lkev.in</span>
                    <a href="//api.fn.lkev.in" class="btn text"><span class="material-symbols-outlined">open_in_new</span></a>
                </div>
            </div>
        </div>
    </div>

    <div id="tooltip" class="invisible" ref="tooltip"></div>
</template>

<script>
export default {
    name: 'Status',
    mounted() {
        const tooltip = this.$refs.tooltip;

        if (tooltip) {
            let mouseX = 0;
            let mouseY = 0;
            let tooltipX = 0;
            let tooltipY = 0;

            const updateTooltipPosition = () => {
                tooltipX += (mouseX - tooltipX) * 0.17;
                tooltipY += (mouseY - tooltipY) * 0.17;
                tooltip.style.top = tooltipY + 'px';
                tooltip.style.left = tooltipX + 'px';
                requestAnimationFrame(updateTooltipPosition);
            };

            requestAnimationFrame(updateTooltipPosition);

            document.addEventListener('mouseover', (e) => {
                if (e.target.hasAttribute('title')) {
                    const title = e.target.getAttribute('title');
                    e.target.setAttribute('data-original-title', title);
                    e.target.removeAttribute('title');
                }
            });

            document.addEventListener('mousemove', (e) => {
                mouseY = e.clientY + window.scrollY - 30;
                mouseX = e.clientX - 85;

                if (e.target.hasAttribute('data-original-title')) {
                    const title = e.target.getAttribute('data-original-title');
                    tooltip.innerHTML = title;
                    tooltip.classList.remove('invisible');
                } else {
                    tooltip.classList.add('invisible');
                }
            });

            document.addEventListener('mouseout', (e) => {
                if (e.target.hasAttribute('data-original-title')) {
                    const title = e.target.getAttribute('data-original-title');
                    e.target.setAttribute('title', title);
                    e.target.removeAttribute('data-original-title');
                }
                tooltip.classList.add('invisible');
            });
        } else {
            console.error('Aucun élément Tooltip ciblé. Enjambement!');
        }

        // collect domains
        const urlList = [];
        document.querySelectorAll('.domain').forEach(domain => {
            const url = domain.querySelector('span')?.innerText;
            if (url) urlList.push(url);
        });

        // check each domain via its /status endpoint
        urlList.forEach(url => {
            fetch(`https://${url}/status`).then(response => {
                if (response.ok) this.setStatus(url.replace(/\./g, '-'), 'active');
                else this.setStatus(url.replace(/\./g, '-'), 'inactive');
            }).catch(error => {
                if (error && error.name === 'TypeError') {
                    this.setStatus(url.replace(/\./g, '-'), 'inactive');
                    return;
                }
                this.setStatus(url.replace(/\./g, '-'), 'na');
            });
        });

        // check notifier services
        fetch('//status.fn.lkev.in/notifier/get/status').then(r => r.json()).then(response => {
            if (response.status === 'error') this.setStatus('service-notifier', 'inactive');
            else this.setStatus('service-notifier', 'active');
        }).catch(() => this.setStatus('service-notifier', 'na'));

        fetch('//status.fn.lkev.in/notifier/get/status?backup=true').then(r => r.json()).then(response => {
            if (response.status === 'error') this.setStatus('service-notifier-backup', 'inactive');
            else if (response.status === 'idle') this.setStatus('service-notifier-backup', 'idle');
            else this.setStatus('service-notifier-backup', 'active');
        }).catch(() => this.setStatus('service-notifier-backup', 'na'));
    },
    methods: {
        setStatus(id, status) {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('verifying');
            el.classList.add(status);
            switch (status) {
                case 'active':
                    el.setAttribute('title', 'Online');
                    break;
                case 'inactive':
                    el.setAttribute('title', 'Offline');
                    break;
                case 'idle':
                    el.setAttribute('title', 'Idle');
                    break;
                default:
                    el.setAttribute('title', 'Errore sconosciuto');
                    break;
            }
        }
    }
}
</script>
<style scoped src="@/assets/css/faq.css"></style>