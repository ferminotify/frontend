<script setup>
    import { useHead } from '@unhead/vue'
    import Title from '@/components/common/Title.vue';
    import Team from '@/components/Team.vue';
    import { coreTeam, createdByTeam, externalCollaborators } from '@/data/team';
    import { SCHEMA_IDS, SITE_NAME, SITE_URL, jsonLdScript } from '@/seo/site';

    // The people behind the project, as members of the Organization (merged by @id).
    const person = ({ name, github, instagram, link }) => {
        const [familyName, ...given] = name.split(' ');
        return {
            '@type': 'Person',
            name: `${given.join(' ')} ${familyName}`.trim(),
            givenName: given.join(' ') || undefined,
            familyName,
            url: link || github,
            sameAs: [github, instagram, link].filter(Boolean),
        };
    };
    const role = (member, roleName) => ({
        '@type': 'OrganizationRole',
        roleName,
        member: person(member),
    });

    useHead({
        script: [
            jsonLdScript('jsonld-team', {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                '@id': SCHEMA_IDS.organization,
                name: SITE_NAME,
                url: `${SITE_URL}/`,
                member: [
                    ...coreTeam.map((m) => role(m, m.roles.join(', '))),
                    ...createdByTeam
                        .filter((m) => !coreTeam.some((c) => c.name === m.name))
                        .map((m) => role(m, `Fondatore (${m.roles.join(', ')})`)),
                    ...externalCollaborators.map((m) => role(m, `Collaboratore esterno (${m.roles.join(', ')})`)),
                ],
                founder: createdByTeam.map(person),
            }),
        ],
    })
</script>

<template>
    <div class="section" id="team-view">
        <Title title="Team" subtitle="Il Team di Fermi Notify" :showVideo="'team'" />
        <p style="line-height: 2.2rem">Fermi Notify è interamente sviluppato da studenti ed ex-studenti dell'IS E. Fermi Mantova senza scopo di lucro.</p>
        <p style="text-align: right;">Un progetto open source: <a href="https://github.com/ferminotify" target="_blank" rel="noopener noreferrer" class="link">GitHub</a>.</p>
        <Team />
    </div>
</template>

<style src="@/assets/css/page.css"></style>
