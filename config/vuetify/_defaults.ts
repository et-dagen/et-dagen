export default {
  // component defaults go here
  VBtn: {
    style: 'text-transform: none',
    size: 'x-large',
  },
  VMain: {
    // fixes problem with VMain rendering under the appbar on SSR
    style: 'padding-top: 90px',
  },
  VDivider: {
    thickness: 2,
  },
  VAlert: {
    maxWidth: '600px',
  },
  VSnackbar: {
    location: 'bottom right',
    zIndex: 1000,
  },
}
