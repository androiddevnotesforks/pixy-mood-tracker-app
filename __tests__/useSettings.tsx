import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, renderHook } from '@testing-library/react-hooks'
import _ from 'lodash'
import { SettingsProvider, useSettings, STORAGE_KEY, INITIAL_STATE } from '../hooks/useSettings'

const wrapper = ({ children }) => (
  <SettingsProvider>
    {children}
  </SettingsProvider>
)

const _renderHook = () => {
  return renderHook(() => ({
    state: useSettings()
  }), { wrapper })
}

const _console_error = console.error

const STATIC_DEVICE_ID = 'test-device-id'

const LOADED_STATE = {
  ...INITIAL_STATE,
  loaded: true,
  deviceId: STATIC_DEVICE_ID
}

jest.mock('uuid', () => ({ v4: () => STATIC_DEVICE_ID }));

describe('useSettings()', () => {

  beforeEach(async () => {
    await AsyncStorage.clear()
    console.error = jest.fn()
  })
  
  afterEach(() => {
    console.error = _console_error
  });
  
  test('should have `loaded` prop', async () => {
    const hook = _renderHook()
    expect(hook.result.current.state.settings.loaded).toBe(false)
    await hook.waitForNextUpdate()
    expect(hook.result.current.state.settings.loaded).toBe(true)
  })

  test('should load from settings async storage & initialize device id if missing', async () => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ...INITIAL_STATE,
      reminderTime: '12:00',
    }))
    const hook = _renderHook()
    await hook.waitForNextUpdate()
    expect(hook.result.current.state.settings.reminderTime).toBe('12:00')
    expect(hook.result.current.state.settings.deviceId).toBe(STATIC_DEVICE_ID)
  })

  test('should initiate with empty `settings` when async storage is empty', async () => {
    const hook = _renderHook()
    await hook.waitForNextUpdate()

    expect(hook.result.current.state.settings).toEqual(LOADED_STATE)
  })

  test('should initiate with empty `settings` when async storage is falsely', async () => {
    AsyncStorage.setItem(STORAGE_KEY, '🐇')
    const hook = _renderHook()
    await hook.waitForNextUpdate()
    expect(console.error).toHaveBeenCalled();
  })

  test('should import', async () => {
    const hook = _renderHook()
    await hook.waitForNextUpdate()
    
    await act(() => {
      hook.result.current.state.importSettings({
        ...INITIAL_STATE,
        reminderTime: '12:00',
      })
    })

    expect(hook.result.current.state.settings.reminderTime).toBe('12:00')
  })

  test('should addActionDone', async () => {
    const hook = _renderHook()
    await hook.waitForNextUpdate()
    
    await act(() => {
      hook.result.current.state.addActionDone('test')
    })

    const ACTIONS_DONE = [{
      title: 'test',
      date: expect.any(String)
    }]
    
    expect(hook.result.current.state.settings.actionsDone).toEqual(ACTIONS_DONE)
    expect(JSON.parse(await AsyncStorage.getItem(STORAGE_KEY))).toEqual({
      ..._.omit(LOADED_STATE, 'loaded'),
      actionsDone: ACTIONS_DONE,
    });
  })

  test('should hasActionDone', async () => {
    const hook = _renderHook()
    await hook.waitForNextUpdate()
    
    await act(() => {
      hook.result.current.state.addActionDone('test')
    })

    expect(hook.result.current.state.hasActionDone('test')).toBe(true)
    expect(hook.result.current.state.hasActionDone('test2')).toBe(false)
  })

  test('should resetSettings', async () => {
    const hook = _renderHook()
    await hook.waitForNextUpdate()
    
    await act(() => {
      hook.result.current.state.resetSettings()
    })

    expect(hook.result.current.state.settings).toEqual(LOADED_STATE)
  })

})