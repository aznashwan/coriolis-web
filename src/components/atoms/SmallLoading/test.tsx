/*
Copyright (C) 2017  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React from 'react'
import { shallow } from 'enzyme'

import TW from '../../../utils/TestWrapper'
import Component, { TEST_ID } from '.'
import type { Props } from '.'

const defaultProps: Props = {
  loadingProgress: 33,
}
const wrap = (props: Props) => new TW(shallow(<Component {...props} />), TEST_ID)

describe('SmallLoading Component', () => {
  it('renders', () => {
    let wrapper = wrap(defaultProps)
    expect(wrapper.findText('progressText')).toBe('33%')
  })
})



